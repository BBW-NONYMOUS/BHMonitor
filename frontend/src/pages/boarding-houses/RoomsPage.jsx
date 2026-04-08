import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const EMPTY_FORM = { room_name: '', capacity: '', price: '', status: 'available', gender_type: 'Mixed', amenities: '' };

const STATUS_COLORS = { available: 'success', occupied: 'default', maintenance: 'secondary' };

export default function RoomsPage() {
    const { id } = useParams();
    const [bh, setBh] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bhRes, roomsRes] = await Promise.all([
                api.get(`/boarding-houses/${id}`),
                api.get(`/boarding-houses/${id}/rooms`),
            ]);
            setBh(bhRes.data);
            setRooms(roomsRes.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setOpen(true); };
    const openEdit = (room) => {
        setEditing(room);
        setForm({
            room_name: room.room_name,
            capacity: room.capacity,
            occupied_slots: room.occupied_slots,
            price: room.price,
            status: room.status || 'available',
            gender_type: room.gender_type || 'Mixed',
            amenities: room.amenities || '',
        });
        setErrors({});
        setOpen(true);
    };

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

    const handleSave = async () => {
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/boarding-houses/${id}/rooms/${editing.id}`, form);
                toast.success('Room updated.');
            } else {
                await api.post(`/boarding-houses/${id}/rooms`, form);
                toast.success('Room added.');
            }
            setOpen(false);
            fetchData();
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error('Failed to save room.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (roomId, roomName) => {
        try {
            await api.delete(`/boarding-houses/${id}/rooms/${roomId}`);
            toast.success(`${roomName} deleted.`);
            fetchData();
        } catch {
            toast.error('Failed to delete room.');
        }
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to={`/boarding-houses/${id}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Rooms</h1>
                        <p className="text-slate-500 text-sm">{bh?.boarding_name}</p>
                    </div>
                </div>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Room</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room Name</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Available</TableHead>
                                <TableHead>Price / mo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amenities</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-slate-400">No rooms yet. Click "Add Room" to get started.</TableCell>
                                </TableRow>
                            ) : rooms.map(room => (
                                <TableRow key={room.id}>
                                    <TableCell className="font-medium">{room.room_name}</TableCell>
                                    <TableCell><Badge variant="secondary">{room.gender_type || 'Mixed'}</Badge></TableCell>
                                    <TableCell>{room.capacity}</TableCell>
                                    <TableCell>{room.available_slots}</TableCell>
                                    <TableCell>₱{Number(room.price).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_COLORS[room.status] || 'secondary'}>{room.status || 'available'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500 max-w-xs truncate">{room.amenities || '—'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => openEdit(room)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete <strong>{room.room_name}</strong>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(room.id, room.room_name)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Room Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit' : 'Add'} Room</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="col-span-2 space-y-1">
                            <Label>Room Name *</Label>
                            <Input value={form.room_name} onChange={set('room_name')} />
                            {errors.room_name && <p className="text-xs text-red-500">{errors.room_name[0]}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Capacity *</Label>
                            <Input type="number" min="1" value={form.capacity} onChange={set('capacity')} />
                            {errors.capacity && <p className="text-xs text-red-500">{errors.capacity[0]}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Price / month *</Label>
                            <Input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
                            {errors.price && <p className="text-xs text-red-500">{errors.price[0]}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Gender Type</Label>
                            <Select value={form.gender_type} onValueChange={set('gender_type')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Mixed">Mixed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={set('status')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="occupied">Occupied</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Amenities</Label>
                            <Input placeholder="e.g. AC, Private bathroom" value={form.amenities} onChange={set('amenities')} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? 'Update' : 'Add'} Room
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
