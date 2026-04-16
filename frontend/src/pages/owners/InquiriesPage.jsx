import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, Mail, Phone, Clock, CheckCircle, XCircle, AlertCircle, Filter, MessageCircle } from 'lucide-react';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   variant: 'warning',     icon: Clock },
    contacted: { label: 'Contacted', variant: 'info',        icon: MessageCircle },
    approved:  { label: 'Approved',  variant: 'success',     icon: CheckCircle },
    declined:  { label: 'Declined',  variant: 'destructive', icon: XCircle },
    cancelled: { label: 'Cancelled', variant: 'secondary',   icon: AlertCircle },
};

export default function ReservationsPage() {
    const { id: boardingHouseId } = useParams();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [updating, setUpdating] = useState(null);

    useEffect(() => { fetchReservations(); }, [boardingHouseId]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/boarding-houses/${boardingHouseId}/reservations`);
            setReservations(data);
        } catch { toast.error('Failed to load reservations.'); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, newStatus) => {
        setUpdating(id);
        try {
            await api.put(`/reservations/${id}`, { status: newStatus });
            setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            toast.success('Reservation updated.');
        } catch { toast.error('Failed to update reservation.'); }
        finally { setUpdating(null); }
    };

    const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);
    const counts = {
        all:       reservations.length,
        pending:   reservations.filter(r => r.status === 'pending').length,
        contacted: reservations.filter(r => r.status === 'contacted').length,
        approved:  reservations.filter(r => r.status === 'approved').length,
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
    );

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-blue-600" /> Student Reservations
                </h1>
                <p className="mt-1 text-sm text-slate-500">Manage reservations for this boarding house.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                    { key: 'all', label: 'Total', color: 'text-slate-900' },
                    { key: 'pending', label: 'Pending', color: 'text-amber-600' },
                    { key: 'contacted', label: 'Contacted', color: 'text-blue-600' },
                    { key: 'approved', label: 'Approved', color: 'text-green-600' },
                ].map(({ key, label, color }) => (
                    <Card key={key} className="cursor-pointer hover:shadow-md" onClick={() => setFilter(key)}>
                        <CardContent className="p-4">
                            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
                            <p className="text-sm text-slate-500">{label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ({counts.all})</SelectItem>
                        <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
                        <SelectItem value="contacted">Contacted ({counts.contacted})</SelectItem>
                        <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-slate-400">
                        <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-40" />
                        <p>No reservations found.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Update</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(res => {
                                    const StatusIcon = STATUS_CONFIG[res.status]?.icon || Clock;
                                    return (
                                        <TableRow key={res.id}>
                                            <TableCell>
                                                <p className="font-medium">{res.full_name}</p>
                                                {res.student_no && <p className="text-xs text-slate-400">{res.student_no}</p>}
                                                {res.course && <p className="text-xs text-slate-400">{res.course} — {res.year_level}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    <p className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        <a href={`mailto:${res.email}`} className="text-blue-600 hover:underline">{res.email}</a>
                                                    </p>
                                                    <p className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-slate-400" />
                                                        <a href={`tel:${res.contact_number}`} className="text-blue-600 hover:underline">{res.contact_number}</a>
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    {res.gender && <Badge variant="outline">{res.gender}</Badge>}
                                                    {res.move_in_date && (
                                                        <p className="text-xs text-slate-500">Move-in: {new Date(res.move_in_date).toLocaleDateString()}</p>
                                                    )}
                                                    {res.message && (
                                                        <p className="max-w-[150px] truncate text-xs text-slate-400" title={res.message}>"{res.message}"</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_CONFIG[res.status]?.variant || 'secondary'} className="gap-1">
                                                    <StatusIcon className="h-3 w-3" />
                                                    {STATUS_CONFIG[res.status]?.label || res.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {new Date(res.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={res.status}
                                                    onValueChange={v => updateStatus(res.id, v)}
                                                    disabled={updating === res.id}
                                                >
                                                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="contacted">Contacted</SelectItem>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="declined">Declined</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
