import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react';

export default function OwnersPage() {
    const [owners, setOwners] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/owners', { params: { search, page } });
            setOwners(data.data);
            setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, [search, page]);

    const handleDelete = async (id, name) => {
        try {
            await api.delete(`/owners/${id}`);
            toast.success(`${name} deleted.`);
            fetchOwners();
        } catch {
            toast.error('Failed to delete owner.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Owners</h1>
                    <p className="text-sm text-slate-500">Manage boarding house owner accounts.</p>
                </div>
                <Link to="/owners/create" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add Owner</Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Boarding Houses</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {owners.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-slate-400">No owners found.</TableCell>
                                    </TableRow>
                                ) : owners.map((owner) => (
                                    <TableRow key={owner.id}>
                                        <TableCell className="font-medium">{owner.full_name}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{owner.email}</TableCell>
                                        <TableCell className="text-sm">{owner.contact_number || '-'}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                {owner.boarding_houses?.length ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/owners/${owner.id}/edit`}>
                                                    <Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                </Link>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-700">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Owner?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete <strong>{owner.full_name}</strong> and their user account.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(owner.id, owner.full_name)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {meta.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Page {meta.current_page} of {meta.last_page} - {meta.total} total
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
