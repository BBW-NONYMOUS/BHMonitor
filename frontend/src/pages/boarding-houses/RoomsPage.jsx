import { useEffect, useRef, useState } from 'react';
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

const EMPTY_FORM = {
    room_name: '',
    capacity: '',
    price: '',
    gender_type: 'Mixed',
    amenities: '',
    boarding_house_id: '',
};

const STATUS_COLORS = {
    available: 'bg-green-100 text-green-700 border-green-200',
    limited: 'bg-amber-100 text-amber-700 border-amber-200',
    full: 'bg-red-100 text-red-700 border-red-200',
    maintenance: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function RoomsPage() {
    const { id } = useParams();
    const { isAdmin, isOwner } = useAuth();
    const [bh, setBh] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ownerBoardingHouses, setOwnerBoardingHouses] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const photoInputRef = useRef(null);
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

            if (isOwner()) {
                const { data } = await api.get('/my-boarding-houses');
                setOwnerBoardingHouses(data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const resetPhotoState = () => {
        photoPreviews.forEach((preview) => {
            if (preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        });
        if (photoInputRef.current) {
            photoInputRef.current.value = '';
        }
        setExistingPhotos([]);
        setPhotoFiles([]);
        setPhotoPreviews([]);
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ ...EMPTY_FORM, boarding_house_id: id });
        setErrors({});
        resetPhotoState();
        setOpen(true);
    };

    const openEdit = (room) => {
        setEditing(room);
        setForm({
            room_name: room.room_name,
            capacity: room.capacity,
            price: room.price,
            gender_type: room.gender_type || 'Mixed',
            amenities: room.amenities || '',
            boarding_house_id: String(room.boarding_house_id || id),
        });
        setErrors({});
        resetPhotoState();
        setExistingPhotos(room.photos || []);
        setOpen(true);
    };

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const validFiles = files.filter((file) => {
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

        const maxAllowed = editing ? 6 : Math.max(0, 6 - existingPhotos.length);
        const combinedFiles = [...photoFiles, ...validFiles].slice(0, maxAllowed);
        setPhotoFiles(combinedFiles);

        const combinedPreviews = [
            ...photoPreviews,
            ...validFiles.map((file) => URL.createObjectURL(file)),
        ].slice(0, maxAllowed);
        setPhotoPreviews(combinedPreviews);
        e.target.value = '';
    };

    const removePhoto = (index) => {
        setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
        setPhotoPreviews((prev) => {
            const preview = prev[index];
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target?.value ?? e }));

    const handleSave = async () => {
        setSaving(true);
        setErrors({});

        try {
            const targetBoardingHouseId = editing ? id : (form.boarding_house_id || id);

            if (!editing && photoFiles.length < 3) {
                toast.error(`Please upload at least 3 room photos (${photoFiles.length} selected)`);
                setSaving(false);
                return;
            }

            if (editing && photoFiles.length > 0 && photoFiles.length < 3) {
                toast.error(`Please upload at least 3 room photos when replacing the current set (${photoFiles.length} selected)`);
                setSaving(false);
                return;
            }

            let payload = form;
            if (photoFiles.length > 0) {
                payload = new FormData();
                Object.entries(form).forEach(([key, value]) => {
                    if (value !== '') payload.append(key, value);
                });
                photoFiles.forEach((file, index) => {
                    payload.append(`photos[${index}]`, file);
                });
            }

            if (editing) {
                await api.put(`/boarding-houses/${id}/rooms/${editing.id}`, payload, {
                    headers: photoFiles.length > 0 ? { 'Content-Type': 'multipart/form-data' } : {},
                });
                toast.success('Room updated.');
            } else {
                await api.post(`/boarding-houses/${targetBoardingHouseId}/rooms`, payload, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Room added.');
            }

            setOpen(false);
            resetPhotoState();
            fetchData();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                toast.error(err.response?.data?.message || 'Failed to save room.');
            }
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

    const openAddStudent = async (room) => {
        setAddStudentRoom(room);
        setSelectedStudentId('');
        try {
            const { data } = await api.get(`/boarding-houses/${id}/rooms/${room.id}/students`);
            setAvailableStudents(data);
        } catch {
            toast.error('Failed to load students.');
        }
    };

    const handleAddStudent = async () => {
        if (!selectedStudentId) return;

        setAddingStudent(true);
        try {
            await api.post(`/boarding-houses/${id}/rooms/${addStudentRoom.id}/add-student`, {
                student_id: selectedStudentId,
            });
            toast.success('Student assigned to room.');
            setAddStudentRoom(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign student.');
        } finally {
            setAddingStudent(false);
        }
    };

    const handleRemoveStudent = async (room, student) => {
        try {
            await api.delete(`/boarding-houses/${id}/rooms/${room.id}/students/${student.id}`);
            toast.success(`${student.first_name} removed from room.`);
            fetchData();
        } catch {
            toast.error('Failed to remove student.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
        );
    }

    const totalPhotoCount = editing && photoFiles.length > 0
        ? photoPreviews.length
        : existingPhotos.length + photoPreviews.length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to={`/boarding-houses/${id}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Rooms</h1>
                        <p className="text-sm text-slate-500">{bh?.boarding_name}</p>
                    </div>
                </div>
                {isOwner() && (
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Room
                    </Button>
                )}
                {isAdmin() && (
                    <span className="text-xs italic text-slate-400">Admins can view and delete rooms only.</span>
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
                                    <TableCell colSpan={8} className="py-10 text-center text-slate-400">
                                        No rooms yet. {isOwner() && 'Click "Add Room" to get started.'}
                                    </TableCell>
                                </TableRow>
                            ) : rooms.map((room) => {
                                const status = room.computed_status || 'available';
                                const studentCount = room.student_count ?? (room.students?.length ?? 0);

                                return (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">{room.room_name}</TableCell>
                                        <TableCell><span className="text-xs text-slate-500">{room.gender_type || 'Mixed'}</span></TableCell>
                                        <TableCell><span className="text-sm">{studentCount} / {room.capacity}</span></TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] || STATUS_COLORS.available}`}>
                                                {status}
                                            </span>
                                        </TableCell>
                                        <TableCell>PHP {Number(room.price).toLocaleString()}</TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-slate-500">{room.amenities || '-'}</TableCell>
                                        <TableCell>
                                            {room.students?.length ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {room.students.map((student) => (
                                                        <div key={student.id} className="flex items-center gap-1 text-xs">
                                                            <span className="text-slate-600">{student.first_name} {student.last_name}</span>
                                                            {isOwner() && (
                                                                <button
                                                                    onClick={() => handleRemoveStudent(room, student)}
                                                                    className="ml-1 text-red-400 hover:text-red-600"
                                                                    title="Remove from room"
                                                                >
                                                                    <UserMinus className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isOwner() && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-blue-500 hover:bg-blue-50"
                                                        title="Add student to room"
                                                        disabled={status === 'full'}
                                                        onClick={() => openAddStudent(room)}
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {isOwner() && (
                                                    <Button size="icon" variant="ghost" onClick={() => openEdit(room)} title="Edit room">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-700" title="Delete room">
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

            {isOwner() && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto scroll-smooth">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit' : 'Add'} Room</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div className="col-span-2 space-y-1">
                                <Label>Room Name *</Label>
                                <Input value={form.room_name} onChange={set('room_name')} placeholder="e.g. Room 101" />
                                {errors.room_name && <p className="text-xs text-red-500">{errors.room_name[0]}</p>}
                            </div>

                            {ownerBoardingHouses.length > 1 && (
                                <div className="col-span-2 space-y-1">
                                    <Label>Boarding House *</Label>
                                    <Select value={String(form.boarding_house_id || '')} onValueChange={(value) => setForm((prev) => ({ ...prev, boarding_house_id: value }))}>
                                        <SelectTrigger><SelectValue placeholder="Select boarding house" /></SelectTrigger>
                                        <SelectContent>
                                            {ownerBoardingHouses.map((boardingHouse) => (
                                                <SelectItem key={boardingHouse.id} value={String(boardingHouse.id)}>
                                                    {boardingHouse.boarding_name} - {boardingHouse.address}
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

                            <div className="col-span-2 mt-2 space-y-3 border-t pt-4">
                                {editing && existingPhotos.length > 0 && photoFiles.length === 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-500">
                                            Existing room photos are shown below. Uploading new photos will replace the entire set.
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {existingPhotos.map((photo) => (
                                                <div key={photo.id} className="aspect-square overflow-hidden rounded-lg border">
                                                    <img
                                                        src={photo.photo_url || `/storage/${photo.photo_path}`}
                                                        alt="Existing room"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Room Photos {!editing && <span className="text-red-500">*</span>}
                                        <span className="text-xs font-normal text-slate-400">
                                            ({totalPhotoCount}/6) {!editing && 'min 3 required'}
                                        </span>
                                    </Label>
                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handlePhotoSelect}
                                    />
                                    {totalPhotoCount < 6 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => photoInputRef.current?.click()}
                                        >
                                                <Upload className="h-4 w-4" />
                                                Add Photos
                                        </Button>
                                    )}
                                </div>

                                {photoPreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {photoPreviews.map((preview, index) => (
                                            <div key={preview} className="relative aspect-square overflow-hidden rounded-lg border">
                                                <img
                                                    src={preview}
                                                    alt={`Room photo ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!editing && photoFiles.length < 3 && (
                                    <p className="text-xs text-amber-600">
                                        Please upload at least 3 photos of the room. Up to 6 photos are allowed.
                                    </p>
                                )}
                                {editing && photoFiles.length > 0 && photoFiles.length < 3 && (
                                    <p className="text-xs text-amber-600">
                                        Upload at least 3 replacement photos if you want to change the current set.
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

            <Dialog open={!!addStudentRoom} onOpenChange={(value) => !value && setAddStudentRoom(null)}>
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
                            <p className="py-4 text-center text-sm text-slate-400">No unassigned students found in this boarding house.</p>
                        ) : (
                            <div className="space-y-1">
                                <Label>Select Student</Label>
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                    <SelectTrigger><SelectValue placeholder="Choose a student..." /></SelectTrigger>
                                    <SelectContent>
                                        {availableStudents.map((student) => (
                                            <SelectItem key={student.id} value={String(student.id)}>
                                                {student.first_name} {student.last_name} - {student.student_no}
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
