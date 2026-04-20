import { useRef, useState } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Database, Download, Upload, AlertTriangle, Loader2 } from 'lucide-react';

export default function BackupRestorePage() {
    const [exporting, setExporting] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileRef = useRef(null);

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await api.get('/backup/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const disposition = response.headers['content-disposition'] || '';
            const match = disposition.match(/filename="?([^"]+)"?/i);
            const filename = match?.[1] || `backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.json`;

            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Database backup downloaded.');
        } catch (err) {
            let message = 'Failed to export backup.';

            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const parsed = JSON.parse(text);
                    message = parsed.message || message;
                } catch {
                    // Keep default message when the error body is not JSON.
                }
            }

            toast.error(message);
        } finally {
            setExporting(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) return;

        setRestoring(true);
        try {
            const formData = new FormData();
            formData.append('backup_file', selectedFile);

            await api.post('/backup/restore', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Database restored successfully. Please refresh the page.');
            setSelectedFile(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch (err) {
            toast.error(err.response?.data?.message || 'Restore failed.');
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold">
                    <Database className="h-6 w-6 text-blue-600" /> Backup & Restore
                </h1>
                <p className="text-sm text-slate-500">Export or restore the system database. Admin access only.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Download className="h-4 w-4 text-emerald-600" /> Export Database Backup
                    </CardTitle>
                    <CardDescription>
                        Download a full backup of the current system data as a portable JSON snapshot.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExport} disabled={exporting} className="bg-emerald-600 hover:bg-emerald-700">
                        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {exporting ? 'Exporting...' : 'Download Backup'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-amber-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-amber-700">
                        <Upload className="h-4 w-4" /> Restore from Backup
                    </CardTitle>
                    <CardDescription>
                        Upload a previously exported <code>.json</code> backup file to restore the database.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                        <div>
                            <p className="font-semibold">Warning: this action is irreversible</p>
                            <p className="mt-1">Restoring will overwrite the current data with the contents of the backup file.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Select Backup File</label>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".json"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                        />
                        {selectedFile && (
                            <p className="text-xs text-slate-500">
                                Selected: <span className="font-medium">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={!selectedFile || restoring}>
                                {restoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {restoring ? 'Restoring...' : 'Restore Database'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Database Restore</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently overwrite all current data with the contents of <strong>{selectedFile?.name}</strong>. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRestore} className="bg-red-600 hover:bg-red-700">
                                    Yes, Restore Database
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
