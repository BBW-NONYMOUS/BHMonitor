import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Upload, Trash2, CheckCircle, Download, ShieldCheck } from 'lucide-react';

const DOC_TYPES = [
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'id', label: 'School ID / Gov\'t ID' },
    { value: 'medical', label: 'Medical Certificate' },
    { value: 'transcript', label: 'Transcript of Records' },
    { value: 'other', label: 'Other' },
];

const TYPE_LABELS = Object.fromEntries(DOC_TYPES.map(d => [d.value, d.label]));

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentDocumentsPage() {
    const { user, isAdmin } = useAuth();
    const studentId = user?.student_id;
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({ document_name: '', document_type: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const fileRef = useRef();

    const fetchDocs = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/students/${studentId}/documents`);
            setDocs(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocs(); }, [studentId]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) { toast.error('Please select a file.'); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('document_name', form.document_name);
            fd.append('document_type', form.document_type);
            fd.append('file', selectedFile);
            await api.post(`/students/${studentId}/documents`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Document uploaded successfully.');
            setUploadOpen(false);
            setForm({ document_name: '', document_type: '' });
            setSelectedFile(null);
            fetchDocs();
        } catch (err) {
            const msg = err.response?.data?.errors?.file?.[0]
                || err.response?.data?.message
                || 'Upload failed.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/students/${studentId}/documents/${id}`);
            toast.success('Document deleted.');
            setDocs(prev => prev.filter(d => d.id !== id));
        } catch {
            toast.error('Failed to delete document.');
        }
    };

    const handleVerify = async (id) => {
        try {
            const { data } = await api.put(`/students/${studentId}/documents/${id}/verify`);
            setDocs(prev => prev.map(d => d.id === id ? data : d));
            toast.success('Document verified.');
        } catch {
            toast.error('Failed to verify document.');
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
                    <p className="text-sm text-slate-500">Upload PDF or DOCX files for verification.</p>
                </div>
                <Button onClick={() => setUploadOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Document
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-3 p-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center">
                            <FileText className="mb-3 h-10 w-10 text-slate-300" />
                            <p className="font-medium text-slate-600">No documents uploaded yet</p>
                            <p className="text-sm text-slate-400">Upload your PDF or DOCX files above.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {docs.map((doc) => (
                                <li key={doc.id} className="flex items-start gap-3 p-4">
                                    <FileText className="mt-1 h-5 w-5 shrink-0 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-slate-900 truncate">{doc.document_name}</p>
                                            <Badge variant="outline" className="text-xs">
                                                {TYPE_LABELS[doc.document_type] || doc.document_type}
                                            </Badge>
                                            {doc.verified_at ? (
                                                <Badge variant="success" className="gap-1 text-xs">
                                                    <CheckCircle className="h-3 w-3" /> Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">Pending</Badge>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {doc.file_original_name} · {formatBytes(doc.file_size)}
                                            {doc.uploader && ` · Uploaded by ${doc.uploader.name}`}
                                        </p>
                                        {doc.verified_at && doc.verifier && (
                                            <p className="text-xs text-green-600">
                                                Verified by {doc.verifier.name} on {new Date(doc.verified_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                            <Button size="icon" variant="ghost" title="Download">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </a>
                                        {isAdmin() && !doc.verified_at && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-green-600 hover:bg-green-50"
                                                title="Verify"
                                                onClick={() => handleVerify(doc.id)}
                                            >
                                                <ShieldCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete <strong>{doc.document_name}</strong>.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(doc.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="space-y-1">
                            <Label>Document Name</Label>
                            <Input
                                placeholder="e.g. Birth Certificate"
                                value={form.document_name}
                                onChange={e => setForm(p => ({ ...p, document_name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Document Type</Label>
                            <Select value={form.document_type} onValueChange={v => setForm(p => ({ ...p, document_type: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOC_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>File (PDF or DOCX, max 5MB)</Label>
                            <div
                                className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-200 p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload className="mb-2 h-6 w-6 text-slate-400" />
                                {selectedFile ? (
                                    <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
                                ) : (
                                    <p className="text-sm text-slate-500">Click to select PDF or DOCX file</p>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf,.docx,.doc"
                                    className="hidden"
                                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
