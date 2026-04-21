import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
    BookOpen, Mail, Phone, Clock, CheckCircle, XCircle,
    AlertCircle, RefreshCw, MessageCircle, MapPin,
    UserPlus, Loader2, Users, CalendarDays, Eye
} from 'lucide-react';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500',  icon: Clock },
    contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700 border-blue-200',   dot: 'bg-blue-500',   icon: MessageCircle },
    approved:  { label: 'Approved',  color: 'bg-green-100 text-green-700 border-green-200',dot: 'bg-green-500',  icon: CheckCircle },
    declined:  { label: 'Declined',  color: 'bg-red-100 text-red-700 border-red-200',      dot: 'bg-red-500',    icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200',dot: 'bg-slate-400',  icon: AlertCircle },
};

const FILTER_TABS = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'approved',  label: 'Approved' },
    { key: 'declined',  label: 'Declined' },
    { key: 'cancelled', label: 'Cancelled' },
];

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name[0].toUpperCase();
}

function isReservationAssigned(reservation) {
    return Number(reservation.student?.boarding_house_id) === Number(reservation.boarding_house_id);
}

export default function ReservationsPage() {
    const { id: boardingHouseId } = useParams();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [updating, setUpdating] = useState(null);

    // Student profile modal
    const [profileTarget, setProfileTarget] = useState(null);

    // Assign dialog
    const [assignTarget, setAssignTarget] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomId, setRoomId] = useState('');
    const [accepting, setAccepting] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(false);

    useEffect(() => { fetchReservations(); }, [boardingHouseId]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/boarding-houses/${boardingHouseId}/reservations`);
            setReservations(data);
        } catch {
            toast.error('Failed to load reservations.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        const snapshot = reservations;
        // Optimistic — change immediately so the Select shows the new value right away
        setReservations(rs => rs.map(r => r.id === id ? { ...r, status: newStatus } : r));
        setUpdating(id);
        try {
            const { data } = await api.put(`/reservations/${id}`, { status: newStatus });
            setReservations(rs => rs.map(r => r.id === id ? { ...r, ...data.reservation } : r));
            toast.success(`Status set to "${STATUS_CONFIG[newStatus]?.label || newStatus}".`);
        } catch (err) {
            setReservations(snapshot);          // revert on failure
            toast.error(err.response?.data?.message || 'Failed to update status.');
        } finally {
            setUpdating(null);
        }
    };

    const openAssign = async (reservation) => {
        setAssignTarget(reservation);
        setRoomId('');
        setLoadingRooms(true);
        try {
            const { data } = await api.get(`/boarding-houses/${boardingHouseId}/rooms`);
            setRooms(data.filter(r => r.computed_status !== 'full'));
        } catch {
            setRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleAssign = async () => {
        if (!assignTarget) return;
        setAccepting(true);
        try {
            await api.post('/students/from-reservation', {
                reservation_id: assignTarget.id,
                ...(roomId && roomId !== 'none' ? { room_id: roomId } : {}),
            });
            toast.success(`${assignTarget.full_name} has been assigned as a student.`);
            setAssignTarget(null);
            fetchReservations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign student.');
        } finally {
            setAccepting(false);
        }
    };

    const counts = {
        all:       reservations.length,
        pending:   reservations.filter(r => r.status === 'pending').length,
        contacted: reservations.filter(r => r.status === 'contacted').length,
        approved:  reservations.filter(r => r.status === 'approved').length,
        declined:  reservations.filter(r => r.status === 'declined').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
    };

    const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-2">

            {/* ── Header ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        Student Reservations
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage reservation requests for this boarding house.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchReservations} disabled={loading} className="w-full sm:w-auto">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { key: 'all',       label: 'Total',     bg: 'bg-white',    text: 'text-slate-900', border: 'border-slate-200', icon: Users },
                    { key: 'pending',   label: 'Pending',   bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Clock },
                    { key: 'contacted', label: 'Contacted', bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-200',  icon: MessageCircle },
                    { key: 'approved',  label: 'Approved',  bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: CheckCircle },
                ].map(({ key, label, bg, text, border, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${bg} ${border} ${filter === key ? 'ring-2 ring-blue-500 ring-offset-1 shadow-md' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <p className={`text-2xl font-bold ${text}`}>{counts[key]}</p>
                            <Icon className={`h-5 w-5 opacity-50 ${text}`} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{label}</p>
                    </button>
                ))}
            </div>

            {/* ── Filter Tabs ── */}
            <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {FILTER_TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                            filter === key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {label}
                        <span className={`rounded-full px-1.5 text-xs leading-5 ${filter === key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <BookOpen className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-600">No reservations found</p>
                        <p className="mt-1 text-sm text-slate-400">
                            {filter === 'all' ? 'No students have made reservations yet.' : `No ${filter} reservations.`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden border-slate-200">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="font-semibold text-slate-700 w-48">Student</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Details</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Date</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                        <TableHead className="font-semibold text-slate-700 w-40">Update Status</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((reservation) => {
                                        const alreadyAssigned = isReservationAssigned(reservation);
                                        const isUpdating = updating === reservation.id;
                                        return (
                                            <TableRow key={reservation.id} className="hover:bg-slate-50/60 align-top">

                                                {/* Student */}
                                                <TableCell className="py-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <button
                                                            onClick={() => setProfileTarget(reservation)}
                                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                                                            title="View profile"
                                                        >
                                                            {initials(reservation.full_name)}
                                                        </button>
                                                        <div>
                                                            <button
                                                                onClick={() => setProfileTarget(reservation)}
                                                                className="font-medium text-slate-900 hover:text-blue-600 hover:underline text-left"
                                                            >
                                                                {reservation.full_name}
                                                            </button>
                                                            {reservation.student_no && (
                                                                <p className="text-xs text-slate-400 font-mono">{reservation.student_no}</p>
                                                            )}
                                                            {reservation.course && (
                                                                <p className="text-xs text-slate-400">{reservation.course} · {reservation.year_level}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Contact */}
                                                <TableCell className="py-3">
                                                    <div className="space-y-1 text-sm">
                                                        <a href={`mailto:${reservation.email}`} className="flex items-center gap-1 text-slate-600 hover:text-blue-600">
                                                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                                                            <span className="truncate max-w-36">{reservation.email}</span>
                                                        </a>
                                                        <a href={`tel:${reservation.contact_number}`} className="flex items-center gap-1 text-slate-600 hover:text-blue-600">
                                                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                                                            {reservation.contact_number}
                                                        </a>
                                                        {reservation.address && (
                                                            <p className="flex items-start gap-1 text-slate-500">
                                                                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                                                                <span className="truncate max-w-36">{reservation.address}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Details */}
                                                <TableCell className="py-3">
                                                    <div className="space-y-1">
                                                        {reservation.gender && (
                                                            <span className="inline-block rounded border border-slate-200 px-1.5 text-xs text-slate-600">{reservation.gender}</span>
                                                        )}
                                                        {reservation.move_in_date && (
                                                            <p className="flex items-center gap-1 text-xs text-slate-500">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {new Date(reservation.move_in_date).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {reservation.message && (
                                                            <p className="max-w-32 truncate text-xs text-slate-400 italic" title={reservation.message}>
                                                                "{reservation.message}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Date */}
                                                <TableCell className="py-3 text-sm text-slate-500 whitespace-nowrap">
                                                    {new Date(reservation.created_at).toLocaleDateString()}
                                                </TableCell>

                                                {/* Status badge */}
                                                <TableCell className="py-3">
                                                    <StatusBadge status={reservation.status} />
                                                </TableCell>

                                                {/* Update Status dropdown */}
                                                <TableCell className="py-3">
                                                    {alreadyAssigned ? (
                                                        <span className="text-xs text-slate-400 italic">Assigned</span>
                                                    ) : (
                                                        <Select
                                                            value={reservation.status}
                                                            onValueChange={(val) => updateStatus(reservation.id, val)}
                                                            disabled={isUpdating}
                                                        >
                                                            <SelectTrigger className="h-8 w-36 text-xs border-slate-200 bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                                                    <SelectItem key={val} value={val}>
                                                                        <span className="flex items-center gap-2">
                                                                            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                                                                            {cfg.label}
                                                                        </span>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                    {isUpdating && (
                                                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                                                        </p>
                                                    )}
                                                </TableCell>

                                                {/* Action */}
                                                <TableCell className="py-3">
                                                    {alreadyAssigned ? (
                                                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                                            <CheckCircle className="h-3.5 w-3.5" /> Assigned
                                                        </span>
                                                    ) : ['declined', 'cancelled'].includes(reservation.status) ? (
                                                        <span className="text-xs text-slate-300">—</span>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="gap-1 bg-green-600 hover:bg-green-700 text-white h-8"
                                                            onClick={() => openAssign(reservation)}
                                                        >
                                                            <UserPlus className="h-3.5 w-3.5" />
                                                            Assign
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Student Profile Modal ── */}
            <Dialog open={!!profileTarget} onOpenChange={v => !v && setProfileTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-blue-600" />
                            Student Profile
                        </DialogTitle>
                    </DialogHeader>
                    {profileTarget && (
                        <div className="space-y-4 py-1">
                            {/* Avatar + name */}
                            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow">
                                    {initials(profileTarget.full_name)}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900">{profileTarget.full_name}</p>
                                    {profileTarget.student_no && (
                                        <p className="font-mono text-sm text-slate-500">{profileTarget.student_no}</p>
                                    )}
                                    <div className="mt-1">
                                        <StatusBadge status={profileTarget.status} />
                                    </div>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {profileTarget.course && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Course</p>
                                        <p className="mt-0.5 font-medium text-slate-900">{profileTarget.course}</p>
                                    </div>
                                )}
                                {profileTarget.year_level && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Year Level</p>
                                        <p className="mt-0.5 font-medium text-slate-900">{profileTarget.year_level}</p>
                                    </div>
                                )}
                                {profileTarget.gender && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Gender</p>
                                        <p className="mt-0.5 font-medium text-slate-900">{profileTarget.gender}</p>
                                    </div>
                                )}
                                {profileTarget.move_in_date && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Move-in Date</p>
                                        <p className="mt-0.5 font-medium text-slate-900">{new Date(profileTarget.move_in_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {profileTarget.budget && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Budget</p>
                                        <p className="mt-0.5 font-medium text-green-700">₱{Number(profileTarget.budget).toLocaleString()}/mo</p>
                                    </div>
                                )}
                            </div>

                            {/* Contact */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact</p>
                                <a href={`mailto:${profileTarget.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                                    <Mail className="h-4 w-4 text-slate-400" /> {profileTarget.email}
                                </a>
                                <a href={`tel:${profileTarget.contact_number}`} className="flex items-center gap-2 text-slate-700 hover:text-blue-600">
                                    <Phone className="h-4 w-4 text-slate-400" /> {profileTarget.contact_number}
                                </a>
                                {profileTarget.address && (
                                    <p className="flex items-start gap-2 text-slate-600">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {profileTarget.address}
                                    </p>
                                )}
                            </div>

                            {/* Message */}
                            {profileTarget.message && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-400">Message to Owner</p>
                                    <p className="text-sm text-slate-700 italic">"{profileTarget.message}"</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProfileTarget(null)}>Close</Button>
                        {profileTarget && !isReservationAssigned(profileTarget) && !['declined','cancelled'].includes(profileTarget.status) && (
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => { setProfileTarget(null); openAssign(profileTarget); }}
                            >
                                <UserPlus className="mr-2 h-4 w-4" /> Assign Student
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Assign Student Dialog ── */}
            <Dialog open={!!assignTarget} onOpenChange={v => !v && setAssignTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                                <UserPlus className="h-4 w-4 text-green-600" />
                            </div>
                            Assign Student
                        </DialogTitle>
                    </DialogHeader>
                    {assignTarget && (
                        <div className="space-y-4 py-1">
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                                    {initials(assignTarget.full_name)}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{assignTarget.full_name}</p>
                                    {assignTarget.course && <p className="text-xs text-slate-400">{assignTarget.course} · {assignTarget.year_level}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Assign to Room <span className="font-normal text-slate-400">(optional)</span>
                                </Label>
                                {loadingRooms ? (
                                    <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
                                    </div>
                                ) : (
                                    <Select value={roomId} onValueChange={setRoomId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="No room assignment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No room assignment</SelectItem>
                                            {rooms.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-slate-400">No available rooms</div>
                                            ) : rooms.map(room => (
                                                <SelectItem key={room.id} value={String(room.id)}>
                                                    {room.room_name} — {room.student_count ?? 0}/{room.capacity} slots ({room.gender_type})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <p className="text-xs text-slate-400">Only rooms with available slots are shown.</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setAssignTarget(null)} disabled={accepting}>Cancel</Button>
                        <Button onClick={handleAssign} disabled={accepting || loadingRooms} className="bg-green-600 hover:bg-green-700">
                            {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
