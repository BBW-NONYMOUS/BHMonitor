import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, UserPlus, UserMinus, Users, Upload, X, ImageIcon } from 'lucide-react';

const EMPTY_FORM = { room_name: '', capacity: '', price: '', gender_type: 'Mixed', amenities: '', boarding_house_id: '' };

const STATUS_COLORS = {
    available: 'bg-green-100 text-green-700 border-green-200',
    limited:   'bg-amber-100 text-amber-700 border-amber-200',
    full:      'bg-red-100 text-red-700 border-red-200',
    maintenance: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function RoomsPage() {
    const { id } = useParams();
    const { isAdmin, isOwner } = useAuth();
    const [bh, setBh] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ownerBoardingHouses, setOwnerBoardingHouses] = useState([]);
    // Room form dialog
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    // Room photos - min 3 required - REQ-007
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    // Add Student dialog
    const [addStudentRoom, setAddStudentRoom] = useState(null);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [addingStudent, setAddingStudent] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bhRes, roomsRes] = await Promise.all([
                api.get(`/boarding-houses/${id}`),
                api.get(`/boarding-houses/${id}/rooms`),
            ]);
            setBh(bhRes.data);
            setRooms(roomsRes.data);
            
            // Fetch owner's boarding houses for multi-BH support (REQ-005)
            if (isOwner()) {
                const { data: bhData } = await api.get('/my-boarding-houses');
                setOwnerBoardingHouses(bhData);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...EMPTY_FORM, boarding_house_id: id });
        setErrors({});
        setPhotoFiles([]);
        setPhotoPreviews([]);
        setOpen(true);
    };
    const openEdit   = (room) => {
        setEditing(room);
        setForm({ 
            room_name: room.room_name, 
            capacity: room.capacity, 
            price: room.price, 
            gender_type: room.gender_type || 'Mixed', 
            amenities: room.amenities || '',
            boarding_house_id: room.boarding_house_id || id
        });
        setErrors({});
        // Load existing photos for editing
        if (room.photos && room.photos.length > 0) {
            setPhotoPreviews(room.photos.map(p => `/storage/${p.photo_path}`));
        } else {
            setPhotoPreviews([]);
        }
        setPhotoFiles([]);
        setOpen(true);
    };

    // Handle photo selection - REQ-007 min 3 photos
    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 5MB limit`);
                return false;
            }
            return true;
        });

        // Limit to 6 photos total
        const combined = [...photoFiles, ...validFiles].slice(0, 6);
        setPhotoFiles(combined);

        // Generate previews
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews].slice(0, 6));
    };

    const removePhoto = (index) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => {
            // Revoke object URL to prevent memory leaks
            if (prev[index] && prev[index].startsWith('blob:')) {
                URL.revokeObjectURL(prev[index]);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

    const handleSave = async () => {
        setSaving(true); setErrors({});
        try {
            // REQ-007: Validate min 3 photos for new rooms
            if (!editing && photoFiles.length < 3) {
                toast.error(`Please upload at least 3 room photos (${photoFiles.length} selected)`);
                setSaving(false);
                return;
            }

            // Use FormData when there are photos to upload
            let payload;
            if (photoFiles.length > 0) {
                payload = new FormData();
                Object.entries(form).forEach(([k, v]) => { if (v !== '') payload.append(k, v); });
                photoFiles.forEach((file, index) => {
                    payload.append(`photos[${index}]`, file);
                });
            } else {
                payload = form;
            }

            if (editing) {
                await api.put(`/boarding-houses/${id}/rooms/${editing.id}`, payload, {
                    headers: photoFiles.length > 0 ? { 'Content-Type': 'multipart/form-data' } : {}
                });
                toast.success('Room updated.');
            } else {
                await api.post(`/boarding-houses/${id}/rooms`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });form.boardng_house_i
                toast.success('Room added.');
            }
            setOpen(false);
            setPhotoFiles([]);
            setPhotoPreviews([]);form.boarding_house_
            fetchData();
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error(err.response?.data?.message || 'Failed to save room.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (roomId, roomName) => {
        try {
            await api.delete(`/boarding-houses/${id}/rooms/${roomId}`);
            toast.success(`${roomName} deleted.`);
            fetchData();
        } catch { toast.error('Failed to delete room.'); }
    };

    const openAddStudent = async (room) => {
        setAddStudentRoom(room);
        setSelectedStudentId('');
        try {
            const { data } = await api.get(`/boarding-houses/${id}/rooms/${room.id}/students`);
            setAvailableStudents(data);
        } catch { toast.error('Failed to load students.'); }
    };

    const handleAddStudent = async () => {
        if (!selectedStudentId) return;
        setAddingStudent(true);
        try {
            await api.post(`/boarding-houses/${id}/rooms/${addStudentRoom.id}/add-student`, { student_id: selectedStudentId });
            toast.success('Student assigned to room.');
            setAddStudentRoom(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign student.');
        } finally { setAddingStudent(false); }
    };

    const handleRemoveStudent = async (room, student) => {
        try {
            await api.delete(`/boarding-houses/${id}/rooms/${room.id}/students/${student.id}`);
            toast.success(`${student.first_name} removed from room.`);
            fetchData();
        } catch { toast.error('Failed to remove student.'); }
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
                {/* Only owners can add rooms */}
                {isOwner() && (
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4 mr-2" /> Add Room
                    </Button>
                )}
                {isAdmin() && (
                    <span className="text-xs text-slate-400 italic">Admins can view and delete rooms only.</span>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Slots</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price / mo</TableHead>
                                <TableHead>Amenities</TableHead>
                                <TableHead>Students</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                                        No rooms yet. {isOwner() && 'Click "Add Room" to get started.'}
                                    </TableCell>
                                </TableRow>
                            ) : rooms.map(room => {
                                const status = room.computed_status || 'available';
                                const studentCount = room.student_count ?? (room.students?.length ?? 0);
                                return (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">{room.room_name}</TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-500">{room.gender_type || 'Mixed'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{studentCount} / {room.capacity}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] || STATUS_COLORS.available}`}>
                                                {status}
                                            </span>
                                        </TableCell>
                                        <TableCell>₱{Number(room.price).toLocaleString()}</TableCell>
                                        <TableCell className="text-sm text-slate-500 max-w-xs truncate">{room.amenities || '—'}</TableCell>
                                        <TableCell>
                                            {room.students && room.students.length > 0 ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {room.students.map(s => (
                                                        <div key={s.id} className="flex items-center gap-1 text-xs">
                                                            <span className="text-slate-600">{s.first_name} {s.last_name}</span>
                                                            <button
                                                                onClick={() => handleRemoveStudent(room, s)}
                                                                className="text-red-400 hover:text-red-600 ml-1"
                                                                title="Remove from room"
                                                            >
                                                                <UserMinus className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Add student — available to admin and owner */}
                                                <Button
                                                    size="icon" variant="ghost"
                                                    className="text-blue-500 hover:bg-blue-50"
                                                    title="Add student to room"
                                                    disabled={status === 'full'}
                                                    onClick={() => openAddStudent(room)}
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>

                                                {/* Edit — owner only */}
                                                {isOwner() && (
                                                    <Button size="icon" variant="ghost" onClick={() => openEdit(room)} title="Edit room">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Delete — both admin and owner */}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete room">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete <strong>{room.room_name}</strong> and unassign all students from it.
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
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add / Edit Room Dialog — owner only */}
            {isOwner() && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit' : 'Add'} Room</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div className="col-span-2 space-y-1">
                                <Label>Room Name *</Label>
                                <Input value={form.room_name} onChange={set('room_name')} placeholder="e.g. Room 101" />
                                {errors.room_name && <p className="text-xs text-red-500">{errors.room_name[0]}</p>}
                            </div>
                            {/* BH Selection for multi-BH support (REQ-005) */}
                            {ownerBoardingHouses.length > 1 && (
                                <div className="col-span-2 space-y-1">
                                    <Label>Boarding House *</Label>
                                    <Select value={form.boarding_house_id} onValueChange={(value) => setForm(p => ({ ...p, boarding_house_id: value }))}>
                                        <SelectTrigger><SelectValue placeholder="Select boarding house" /></SelectTrigger>
                                        <SelectContent>
                                            {ownerBoardingHouses.map(bh => (
                                                <SelectItem key={bh.id} value={String(bh.id)}>
                                                    {bh.boarding_name} - {bh.address}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label>Capacity (slots) *</Label>
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
                            <div className="col-span-2 space-y-1">
                                <Label>Amenities</Label>
                                <Input placeholder="e.g. AC, Private bathroom, WiFi" value={form.amenities} onChange={set('amenities')} />
                            </div>

                            {/* Photo Upload Section - REQ-007 min 3 photos */}
                            <div className="col-span-2 space-y-3 border-t pt-4 mt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Room Photos {!editing && <span className="text-red-500">*</span>}
                                        <span className="text-xs text-slate-400 font-normal">
                                            ({photoPreviews.length}/6) {!editing && '· min 3 required'}
                                        </span>
                                    </Label>
                                    {photoPreviews.length < 6 && (
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handlePhotoSelect}
                                            />
                                            <Button type="button" variant="outline" size="sm" className="gap-1">
                                                <Upload className="h-4 w-4" />
                                                Add Photos
                                            </Button>
                                        </label>
                                    )}
                                </div>

                                {/* Photo Previews Grid */}
                                {photoPreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {photoPreviews.map((preview, index) => (
                                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                                <img
                                                    src={preview}
                                                    alt={`Room photo ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!editing && photoPreviews.length < 3 && (
                                    <p className="text-xs text-amber-600">
                                        Please upload at least 3 photos of the room — up to 6 allowed (interior, exterior, facilities)
                                    </p>
                                )}
                            </div>

                            <p className="col-span-2 text-xs text-slate-400">
                                Room availability is automatically calculated from the number of assigned students.
                            </p>
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
            )}

            {/* Add Student to Room Dialog */}
            <Dialog open={!!addStudentRoom} onOpenChange={(v) => !v && setAddStudentRoom(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Assign Student to {addStudentRoom?.room_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-slate-500">
                            Slots: {addStudentRoom?.student_count ?? 0} / {addStudentRoom?.capacity} used
                        </p>
                        {availableStudents.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No unassigned students found in this boarding house.</p>
                        ) : (
                            <div className="space-y-1">
                                <Label>Select Student</Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                    <SelectTrigger><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                                    <SelectContent>
                                        {availableStudents.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.first_name} {s.last_name} — {s.student_no}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddStudentRoom(null)}>Cancel</Button>
                        <Button onClick={handleAddStudent} disabled={!selectedStudentId || addingStudent}>
                            {addingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
