import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNotifications } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import { BookOpen, Mail, Phone, Clock, CheckCircle, XCircle, AlertCircle, Filter, RefreshCw, Building2, MessageCircle, MapPin, UserPlus, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', variant: 'warning', icon: Clock },
    contacted: { label: 'Contacted', variant: 'info', icon: MessageCircle },
    approved: { label: 'Approved', variant: 'success', icon: CheckCircle },
    declined: { label: 'Declined', variant: 'destructive', icon: XCircle },
    cancelled: { label: 'Cancelled', variant: 'secondary', icon: AlertCircle },
};

export default function AllReservationsPage() {
    const navigate = useNavigate();
    const { fetchUnreadCount } = useNotifications();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [updating, setUpdating] = useState(null);

    // Accept student dialog state
    const [acceptTarget, setAcceptTarget] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomId, setRoomId] = useState('');
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reservations');
            setReservations(data);
        } catch {
            toast.error('Failed to load reservations.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        setUpdating(id);
        try {
            const { data } = await api.put(`/reservations/${id}`, { status: newStatus });
            setReservations((prev) => prev.map((r) => (r.id === id ? data.reservation : r)));
            fetchUnreadCount();
            toast.success('Reservation updated.');
        } catch {
            toast.error('Failed to update reservation.');
        } finally {
            setUpdating(null);
        }
    };

    const openAccept = async (reservation) => {
        setAcceptTarget(reservation);
        setRoomId('');
        try {
            const { data } = await api.get(`/boarding-houses/${reservation.boarding_house_id}/rooms`);
            setRooms(data.filter(r => r.computed_status !== 'full'));
        } catch {
            setRooms([]);
        }
    };

    const handleAccept = async () => {
        if (!acceptTarget) return;
        setAccepting(true);
        try {
            await api.post('/students/from-reservation', {
                reservation_id: acceptTarget.id,
                ...(roomId && roomId !== 'none' ? { room_id: roomId } : {}),
            });
            toast.success(`${acceptTarget.full_name} has been accepted as a student.`);
            setAcceptTarget(null);
            fetchReservations();
            fetchUnreadCount();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept student.');
        } finally {
            setAccepting(false);
        }
    };

    const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter);
    const counts = {
        all: reservations.length,
        pending: reservations.filter((r) => r.status === 'pending').length,
        contacted: reservations.filter((r) => r.status === 'contacted').length,
        approved: reservations.filter((r) => r.status === 'approved').length,
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold">
                        <BookOpen className="h-6 w-6 text-blue-600" /> All Reservations
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage all student reservations across your boarding houses.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchReservations} className="w-full sm:w-auto">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                    { key: 'all', label: 'Total', color: 'text-slate-900' },
                    { key: 'pending', label: 'Pending', color: 'text-amber-600' },
                    { key: 'contacted', label: 'Contacted', color: 'text-blue-600' },
                    { key: 'approved', label: 'Approved', color: 'text-green-600' },
                ].map(({ key, label, color }) => (
                    <Card key={key} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setFilter(key)}>
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
                                    <TableHead>Boarding House</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Update Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((reservation) => {
                                    const StatusIcon = STATUS_CONFIG[reservation.status]?.icon || Clock;
                                    const alreadyConverted = !!reservation.student_id;
                                    return (
                                        <TableRow key={reservation.id}>
                                            <TableCell>
                                                <p className="font-medium">{reservation.full_name}</p>
                                                {reservation.student_no && <p className="text-xs text-slate-400">{reservation.student_no}</p>}
                                                {reservation.course && <p className="text-xs text-slate-400">{reservation.course} - {reservation.year_level}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                    <span
                                                        className="cursor-pointer text-sm text-blue-600 hover:underline"
                                                        onClick={() => navigate(`/boarding-houses/${reservation.boarding_house_id}`)}
                                                    >
                                                        {reservation.boarding_house?.boarding_name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    <p className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        <a href={`mailto:${reservation.email}`} className="text-blue-600 hover:underline">{reservation.email}</a>
                                                    </p>
                                                    <p className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-slate-400" />
                                                        <a href={`tel:${reservation.contact_number}`} className="text-blue-600 hover:underline">{reservation.contact_number}</a>
                                                    </p>
                                                    {reservation.address && (
                                                        <p className="flex items-start gap-1 text-slate-500">
                                                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                                                            <span>{reservation.address}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    {reservation.gender && <Badge variant="outline">{reservation.gender}</Badge>}
                                                    {reservation.move_in_date && (
                                                        <p className="text-xs text-slate-500">Move-in: {new Date(reservation.move_in_date).toLocaleDateString()}</p>
                                                    )}
                                                    {reservation.message && (
                                                        <p className="max-w-[150px] truncate text-xs text-slate-400" title={reservation.message}>"{reservation.message}"</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_CONFIG[reservation.status]?.variant || 'secondary'} className="gap-1">
                                                    <StatusIcon className="h-3 w-3" />
                                                    {STATUS_CONFIG[reservation.status]?.label || reservation.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {new Date(reservation.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={reservation.status}
                                                    onValueChange={(value) => updateStatus(reservation.id, value)}
                                                    disabled={updating === reservation.id || alreadyConverted}
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
                                            <TableCell>
                                                {alreadyConverted ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                        <CheckCircle className="h-3.5 w-3.5" /> Accepted
                                                    </span>
                                                ) : reservation.status === 'approved' ? (
                                                    <Button
                                                        size="sm"
                                                        className="gap-1 bg-green-600 hover:bg-green-700"
                                                        onClick={() => openAccept(reservation)}
                                                    >
                                                        <UserPlus className="h-3.5 w-3.5" />
                                                        Accept
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Accept Student Dialog */}
            <Dialog open={!!acceptTarget} onOpenChange={v => !v && setAcceptTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-green-600" />
                            Accept Student
                        </DialogTitle>
                    </DialogHeader>
                    {acceptTarget && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg border bg-slate-50 p-4 space-y-1.5 text-sm">
                                <p><span className="text-slate-500">Name:</span> <span className="font-medium">{acceptTarget.full_name}</span></p>
                                {acceptTarget.student_no && <p><span className="text-slate-500">Student No:</span> <span className="font-mono">{acceptTarget.student_no}</span></p>}
                                <p><span className="text-slate-500">Boarding House:</span> {acceptTarget.boarding_house?.boarding_name || '—'}</p>
                                {acceptTarget.course && <p><span className="text-slate-500">Course:</span> {acceptTarget.course} — {acceptTarget.year_level}</p>}
                                {acceptTarget.gender && <p><span className="text-slate-500">Gender:</span> {acceptTarget.gender}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label>Assign to Room (optional)</Label>
                                <Select value={roomId} onValueChange={setRoomId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="No room assignment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No room assignment</SelectItem>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={String(room.id)}>
                                                {room.room_name} — {room.student_count ?? 0}/{room.capacity} slots ({room.gender_type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-400">Only rooms with available slots are shown.</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAcceptTarget(null)}>Cancel</Button>
                        <Button onClick={handleAccept} disabled={accepting} className="bg-green-600 hover:bg-green-700">
                            {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Accept Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
