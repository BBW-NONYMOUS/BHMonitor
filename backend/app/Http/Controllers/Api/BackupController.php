<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BackupController extends Controller
{
    /**
     * Export database as SQL dump — admin only
     */
    public function export(Request $request)
    {
        $user = $request->user();

        $tables  = Schema::getTableListing();
        $sql     = "-- Student Boarders Monitoring System Backup\n";
        $sql    .= "-- Generated: " . now()->toDateTimeString() . "\n\n";
        $sql    .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            // Skip Laravel internal tables
            if (in_array($table, ['migrations', 'password_reset_tokens', 'sessions', 'cache', 'jobs', 'failed_jobs'])) {
                continue;
            }

            // DROP + CREATE table
            $createTable = DB::select("SHOW CREATE TABLE `{$table}`");
            if (!empty($createTable)) {
                $createSql = $createTable[0]->{'Create Table'} ?? null;
                if ($createSql) {
                    $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
                    $sql .= $createSql . ";\n\n";
                }
            }

            // INSERT data
            $rows = DB::table($table)->get();
            if ($rows->isEmpty()) continue;

            $sql .= "INSERT INTO `{$table}` VALUES\n";
            $chunks = $rows->chunk(100);
            $allValues = [];

            foreach ($rows as $row) {
                $values = array_map(function ($val) {
                    if (is_null($val)) return 'NULL';
                    return "'" . addslashes((string) $val) . "'";
                }, (array) $row);

                $allValues[] = '(' . implode(', ', $values) . ')';
            }

            $sql .= implode(",\n", $allValues) . ";\n\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Admin {$user->name} exported a database backup.",
            'created_at' => now(),
        ]);

        $filename = 'backup_' . now()->format('Ymd_His') . '.sql';

        return response($sql, 200, [
            'Content-Type'        => 'application/sql',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Restore database from uploaded SQL file — admin only
     */
    public function restore(Request $request): JsonResponse
    {
        $request->validate([
            'backup_file' => 'required|file|mimes:sql,txt|max:51200', // max 50MB
        ]);

        $user = $request->user();
        $file = $request->file('backup_file');
        $sql  = file_get_contents($file->getRealPath());

        if (empty(trim($sql))) {
            return response()->json(['message' => 'The backup file is empty.'], 422);
        }

        // Basic safety check — must look like a SQL dump
        if (!Str::contains($sql, ['CREATE TABLE', 'INSERT INTO', 'DROP TABLE'])) {
            return response()->json(['message' => 'The uploaded file does not appear to be a valid SQL backup.'], 422);
        }

        try {
            DB::unprepared($sql);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Restore failed: ' . $e->getMessage(),
            ], 500);
        }

        ActivityLog::create([
            'user_id'    => $user->id,
            'action'     => "Admin {$user->name} restored the database from a backup file.",
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Database restored successfully.']);
    }
}
