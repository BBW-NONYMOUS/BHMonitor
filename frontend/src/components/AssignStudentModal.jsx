import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const GENDER_OPTIONS = ['Male', 'Female'];

export default function AssignStudentModal({ open, onClose, room, boardingHouses = [] }) {
    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const [activeTab, setActiveTab] = useState(isOwner ? 'reservations' : 'manual');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Reservations tab
    const [reservations, setReservations] = useState([]);
    
    // Manual entry tab
    const [manualForm, setManualForm] = useState({
        student_no: '',
        first_name: '',
        last_name: '',
        gender: '',
        course: '',
        year_level: '',
        contact_number: '',
        address: '',
        boarding_house_id: room?.boarding_house_id || '',
    });

    // Fetch approved reservations for direct add
    useEffect(() => {
        if (open && activeTab === 'reservations') {
            fetchReservations();
        }
    }, [open, activeTab]);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reservations/approved-for-direct-add');
            setReservations(data);
        } catch {
            toast.error('Failed to load reservations.');
        } finally {
            setLoading(false);
        }
    };

    const handleDirectAdd = async (reservation) => {
        setSubmitting(true);
        try {
            await api.post('/students/from-reservation', {
                reservation_id: reservation.id,
                boarding_house_id: manualForm.boarding_house_id || room?.boarding_house_id,
            });
            toast.success('Student added from reservation.');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add student.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/students', {
                ...manualForm,
                room_id: room?.id,
            });
            toast.success('Student added successfully.');
            onClose();
        } catch (err) {
            if (err.response?.data?.errors) {
                toast.error(Object.values(err.response.data.errors).flat().join(', '));
            } else {
                toast.error(err.response?.data?.message || 'Failed to add student.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const setManualField = (field) => (e) => {
        setManualForm(p => ({ ...p, [field]: e.target?.value ?? e }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Assign Student to Room</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={`grid w-full ${isOwner ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {isOwner && (
                            <TabsTrigger value="reservations">
                                From Reservations
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="manual">
                            Manual Entry
                        </TabsTrigger>
                    </TabsList>

                    {/* Reservations Tab — owner only */}
                    {isOwner && <TabsContent value="reservations" className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                No approved reservations available.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {reservations.map((reservation) => (
                                    <Card key={reservation.id} className="p-4">
                                        <CardContent className="p-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="success">Approved</Badge>
                                                        <span className="font-medium">{reservation.full_name}</span>
                                                    </div>
                                                    <div className="text-sm text-slate-600 space-y-1">
                                                        <p><strong>Email:</strong> {reservation.email}</p>
                                                        <p><strong>Contact:</strong> {reservation.contact_number}</p>
                                                        <p><strong>Course:</strong> {reservation.course} - {reservation.year_level}</p>
                                                        <p><strong>Budget:</strong> ₱{Number(reservation.budget).toLocaleString()}</p>
                                                        {reservation.message && (
                                                            <p><strong>Message:</strong> {reservation.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleDirectAdd(reservation)}
                                                    disabled={submitting}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-1" />
                                                    Add
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>}

                    {/* Manual Entry Tab */}
                    <TabsContent value="manual" className="space-y-4">
                        {/* BH Selection for multi-BH support (REQ-005) */}
                        {boardingHouses.length > 1 && (
                            <div className="space-y-1">
                                <Label>Boarding House *</Label>
                                <Select
                                    value={manualForm.boarding_house_id}
                                    onValueChange={(value) => setManualForm(p => ({ ...p, boarding_house_id: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select boarding house" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boardingHouses.map(bh => (
                                            <SelectItem key={bh.id} value={String(bh.id)}>
                                                {bh.boarding_name} - {bh.address}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <form onSubmit={handleManualAdd} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Student No *</Label>
                                    <Input
                                        value={manualForm.student_no}
                                        onChange={setManualField('student_no')}
                                        required
                                        placeholder="e.g., 2023-00123"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Gender *</Label>
                                    <Select
                                        value={manualForm.gender}
                                        onValueChange={(value) => setManualForm(p => ({ ...p, gender: value }))}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {GENDER_OPTIONS.map(g => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>First Name *</Label>
                                    <Input
                                        value={manualForm.first_name}
                                        onChange={setManualField('first_name')}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Last Name *</Label>
                                    <Input
                                        value={manualForm.last_name}
                                        onChange={setManualField('last_name')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Contact Number *</Label>
                                <Input
                                    value={manualForm.contact_number}
                                    onChange={setManualField('contact_number')}
                                    required
                                    placeholder="09XXXXXXXXX"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Permanent Address * (REQ-004)</Label>
                                <Input
                                    value={manualForm.address}
                                    onChange={setManualField('address')}
                                    required
                                    placeholder="Full address"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Course *</Label>
                                    <Input
                                        value={manualForm.course}
                                        onChange={setManualField('course')}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Year Level *</Label>
                                    <Select
                                        value={manualForm.year_level}
                                        onValueChange={(value) => setManualForm(p => ({ ...p, year_level: value }))}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select year level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEAR_LEVELS.map(y => (
                                                <SelectItem key={y} value={y}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                    Add Student
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
