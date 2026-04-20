import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Building2, Loader2, CheckCircle, GraduationCap, Phone, MapPin, Mail } from 'lucide-react';

export default function DirectAddPage() {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomId, setRoomId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/reservations/approved-for-direct-add')
            .then(r => setReservations(r.data))
            .catch(() => toast.error('Failed to load approved reservations.'))
            .finally(() => setLoading(false));
    }, []);

    const openConvert = async (reservation) => {
        setSelected(reservation);
        setRoomId('');
        try {
            const { data } = await api.get(`/boarding-houses/${reservation.boarding_house_id}/rooms`);
            setRooms(data.filter(r => r.computed_status !== 'full'));
        } catch {
            setRooms([]);
        }
    };

    const handleConvert = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await api.post('/students/from-reservation', {
                reservation_id: selected.id,
                ...(roomId && roomId !== 'none' ? { room_id: roomId } : {}),
            });
            toast.success(`${selected.full_name} added as a student.`);
            setSelected(null);
            setReservations(prev => prev.filter(r => r.id !== selected.id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to convert reservation.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
                <Link to="/students">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Direct Add from Reservation</h1>
                    <p className="text-sm text-slate-500">Convert approved reservations into student records.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Approved Reservations Pending Conversion
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>No approved reservations available for direct add.</p>
                            <p className="text-xs mt-1">Approve reservations first from the Reservations page.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Boarding House</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reservations.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <p className="font-medium">{r.full_name}</p>
                                            {r.student_no && <p className="text-xs text-slate-400 font-mono">{r.student_no}</p>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                <span>{r.boarding_house?.boarding_name || '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5 text-xs text-slate-500">
                                                {r.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        <span>{r.email}</span>
                                                    </div>
                                                )}
                                                {r.contact_number && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{r.contact_number}</span>
                                                    </div>
                                                )}
                                                {r.address && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{r.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5 text-xs">
                                                {r.course && <p className="text-slate-600">{r.course}</p>}
                                                {r.year_level && (
                                                    <div className="flex items-center gap-1 text-slate-500">
                                                        <GraduationCap className="h-3 w-3" />
                                                        <span>{r.year_level}</span>
                                                    </div>
                                                )}
                                                {r.gender && <Badge variant="outline" className="text-xs">{r.gender}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => openConvert(r)}
                                                className="gap-1"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" />
                                                Add as Student
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Convert Reservation to Student
                        </DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg border bg-slate-50 p-4 space-y-2 text-sm">
                                <p><span className="text-slate-500">Name:</span> <span className="font-medium">{selected.full_name}</span></p>
                                <p><span className="text-slate-500">Student No:</span> <span className="font-mono">{selected.student_no || '—'}</span></p>
                                <p><span className="text-slate-500">Boarding House:</span> <span>{selected.boarding_house?.boarding_name || '—'}</span></p>
                                {selected.course && <p><span className="text-slate-500">Course:</span> <span>{selected.course} — {selected.year_level}</span></p>}
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
                                                {room.room_name} — {room.student_count ?? 0}/{room.capacity} slots
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-400">Only rooms with available slots are shown.</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                        <Button onClick={handleConvert} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Add Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
