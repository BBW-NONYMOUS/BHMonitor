import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, Pencil, Trash2, BedDouble, MapPin } from 'lucide-react';
import { MiniMap } from '@/components/ui/mini-map';

export default function BoardingHousesPage() {
    const [houses, setHouses] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    const fetchHouses = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/boarding-houses', { params: { search, status, page } });
            setHouses(data.data);
            setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHouses(); }, [search, status, page]);

    const handleDelete = async (id, name) => {
        try {
            await api.delete(`/boarding-houses/${id}`);
            toast.success(`${name} deleted.`);
            fetchHouses();
        } catch {
            toast.error('Failed to delete boarding house.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Boarding Houses</h1>
                    <p className="text-slate-500 text-sm">Manage boarding house listings and rooms.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/boarding-houses/map">
                        <Button variant="outline"><MapPin className="h-4 w-4 mr-2" />Map</Button>
                    </Link>
                    <Link to="/boarding-houses/create">
                        <Button><Plus className="h-4 w-4 mr-2" />Add Boarding House</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or address..."
                                className="pl-9"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[160px]">Location</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {houses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-slate-400">No boarding houses found.</TableCell>
                                    </TableRow>
                                ) : houses.map(bh => (
                                    <TableRow key={bh.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{bh.boarding_name}</span>
                                                <span className="text-xs text-slate-400">
                                                    {bh.available_rooms || 0} of {bh.total_rooms || 0} rooms available
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 max-w-xs truncate">{bh.address}</TableCell>
                                        <TableCell className="text-sm">{bh.owner?.full_name || '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant={bh.status === 'active' ? 'success' : 'secondary'}>
                                                    {bh.status === 'active' ? '● Active' : '○ Inactive'}
                                                </Badge>
                                                {bh.status === 'active' ? (
                                                    <span className="text-xs text-green-600">Visible to public</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Hidden from public</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/boarding-houses/${bh.id}`}>
                                                    <Button size="icon" variant="ghost" title="View"><Eye className="h-4 w-4" /></Button>
                                                </Link>
                                                <Link to={`/boarding-houses/${bh.id}/rooms`}>
                                                    <Button size="icon" variant="ghost" title="Rooms"><BedDouble className="h-4 w-4" /></Button>
                                                </Link>
                                                <Link to={`/boarding-houses/${bh.id}/edit`}>
                                                    <Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                </Link>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Boarding House?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete <strong>{bh.boarding_name}</strong>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(bh.id, bh.boarding_name)}>Delete</AlertDialogAction>
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
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                            <p className="text-sm text-slate-500">
                                Page {meta.current_page} of {meta.last_page} · {meta.total} total
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
