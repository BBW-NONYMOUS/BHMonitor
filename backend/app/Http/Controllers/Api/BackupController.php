<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    private array $excludedTables = [
        'migrations',
        'password_reset_tokens',
        'sessions',
        'cache',
        'jobs',
        'failed_jobs',
    ];

    private function exportTables(): array
    {
        $driver = DB::getDriverName();
        $databaseName = DB::getDatabaseName();
        $tables = [];

        foreach (Schema::getTableListing() as $listedTable) {
            $parts = explode('.', (string) $listedTable, 2);

            if (count($parts) === 2) {
                [$schema, $table] = $parts;

                if (in_array($driver, ['mysql', 'mariadb'], true) && $schema !== $databaseName) {
                    continue;
                }
            } else {
                $table = $parts[0];
            }

            if (in_array($table, $this->excludedTables, true)) {
                continue;
            }

            $tables[$table] = $table;
        }

        return array_values($tables);
    }

    private function logActivityIfPossible(?int $userId, string $action): void
    {
        if (!$userId || !Schema::hasTable('users') || !Schema::hasTable('activity_logs')) {
            return;
        }

        $userExists = DB::table('users')->where('id', $userId)->exists();
        if (!$userExists) {
            return;
        }

        ActivityLog::create([
            'user_id'    => $userId,
            'action'     => $action,
            'created_at' => now(),
        ]);
    }

    private function allowedTableSet(): array
    {
        return array_fill_keys($this->exportTables(), true);
    }

    private function snapshotTables(): array
    {
        $snapshot = [];

        foreach ($this->exportTables() as $table) {
            $snapshot[$table] = DB::table($table)
                ->get()
                ->map(fn ($row) => (array) $row)
                ->all();
        }

        return $snapshot;
    }

    private function disableForeignKeys(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }
    }

    private function enableForeignKeys(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    private function buildJsonBackup(): string
    {
        return json_encode([
            'meta' => [
                'app'         => 'Student Boarders Monitoring System',
                'generated_at' => now()->toIso8601String(),
                'driver'      => DB::getDriverName(),
                'format'      => 'json-backup-v1',
            ],
            'tables' => $this->snapshotTables(),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

    private function jsonFlags(): int
    {
        return JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE;
    }

    private function streamJsonBackup(): void
    {
        $meta = [
            'app'          => 'Student Boarders Monitoring System',
            'generated_at' => now()->toIso8601String(),
            'driver'       => DB::getDriverName(),
            'format'       => 'json-backup-v1',
        ];

        echo "{\n";
        echo '    "meta": ' . json_encode($meta, $this->jsonFlags()) . ",\n";
        echo "    \"tables\": {\n";

        $tables = $this->exportTables();
        foreach ($tables as $tableIndex => $table) {
            echo '        ' . json_encode($table, $this->jsonFlags()) . ": [";

            $columns = Schema::getColumnListing($table);
            $query = DB::table($table);
            if (!empty($columns)) {
                $query->orderBy($columns[0]);
            }

            $firstRow = true;
            foreach ($query->cursor() as $row) {
                echo $firstRow ? "\n" : ",\n";
                echo '            ' . json_encode((array) $row, $this->jsonFlags());
                $firstRow = false;
            }

            if (!$firstRow) {
                echo "\n        ";
            }

            echo ']';
            if ($tableIndex < count($tables) - 1) {
                echo ',';
            }
            echo "\n";

            if (function_exists('flush')) {
                flush();
            }
        }

        echo "    }\n";
        echo "}\n";
    }

    private function restoreJsonBackup(array $tables): void
    {
        $allowedTables = $this->allowedTableSet();
        $tables = array_intersect_key($tables, $allowedTables);

        $this->disableForeignKeys();
        DB::beginTransaction();

        try {
            foreach (array_reverse(array_keys($allowedTables)) as $table) {
                DB::table($table)->delete();
            }

            foreach ($tables as $table => $rows) {
                if (!is_array($rows) || empty($rows)) {
                    continue;
                }

                foreach (array_chunk($rows, 100) as $chunk) {
                    DB::table($table)->insert($chunk);
                }
            }

            $this->enableForeignKeys();
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->enableForeignKeys();
            throw $e;
        }
    }

    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        set_time_limit(0);
        ignore_user_abort(true);

        $this->logActivityIfPossible(
            $user?->id,
            "Admin {$user->name} exported a database backup."
        );

        $filename = 'backup_' . now()->format('Ymd_His') . '.json';

        return response()->streamDownload(function () {
            $this->streamJsonBackup();
        }, $filename, [
            'Content-Type' => 'application/json',
        ]);
    }

    public function restore(Request $request): JsonResponse
    {
        $request->validate([
            'backup_file' => 'required|file|mimes:json|max:51200',
        ]);

        set_time_limit(0);
        ignore_user_abort(true);

        $user = $request->user();
        $file = $request->file('backup_file');
        $contents = file_get_contents($file->getRealPath());

        if (empty(trim((string) $contents))) {
            return response()->json(['message' => 'The backup file is empty.'], 422);
        }

        try {
            $decoded = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);

            if (!is_array($decoded) || !isset($decoded['tables']) || !is_array($decoded['tables'])) {
                return response()->json(['message' => 'The uploaded file does not appear to be a valid JSON backup.'], 422);
            }

            $this->restoreJsonBackup($decoded['tables']);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Restore failed: ' . $e->getMessage(),
            ], 500);
        }

        $this->logActivityIfPossible(
            $user?->id,
            "Admin {$user->name} restored the database from a backup file."
        );

        return response()->json(['message' => 'Database restored successfully.']);
    }
}
