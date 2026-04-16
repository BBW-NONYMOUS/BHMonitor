<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentDocumentController extends Controller
{
    public function index(Student $student): JsonResponse
    {
        $documents = $student->documents()
            ->with('uploader:id,name', 'verifier:id,name')
            ->latest()
            ->get();

        return response()->json($documents);
    }

    public function store(Request $request, Student $student): JsonResponse
    {
        $request->validate([
            'document_name' => 'required|string|max:255',
            'document_type' => 'required|in:birth_certificate,id,medical,transcript,other',
            'file'          => 'required|file|mimes:pdf,docx,doc|max:5120',
        ]);

        $path = $request->file('file')->store('student_documents', 'public');

        $doc = $student->documents()->create([
            'document_name'      => $request->document_name,
            'document_type'      => $request->document_type,
            'file_path'          => $path,
            'file_original_name' => $request->file('file')->getClientOriginalName(),
            'file_size'          => $request->file('file')->getSize(),
            'uploaded_by'        => $request->user()->id,
        ]);

        return response()->json($doc->load('uploader:id,name'), 201);
    }

    public function destroy(Request $request, Student $student, StudentDocument $document): JsonResponse
    {
        if ($document->student_id !== $student->id) {
            abort(404);
        }

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }

    public function verify(Request $request, Student $student, StudentDocument $document): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (!$user->isAdmin()) {
            abort(403, 'Only admins can verify documents.');
        }
        if ($document->student_id !== $student->id) {
            abort(404);
        }

        $document->update([
            'verified_at' => now(),
            'verified_by' => $user->id,
        ]);

        return response()->json($document->load('uploader:id,name', 'verifier:id,name'));
    }
}
