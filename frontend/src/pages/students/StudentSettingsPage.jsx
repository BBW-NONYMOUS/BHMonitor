import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Save, UserRound } from 'lucide-react';

const blankForm = {
    first_name: '',
    last_name: '',
    gender: '',
    course: '',
    year_level: '',
    contact_number: '',
    address: '',
    parent_name: '',
    parent_contact: '',
    boarding_house_id: '',
};

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

function statusClass(status) {
    if (status === 'approved') return 'border-green-200 bg-green-50 text-green-700';
    if (status === 'rejected' || status === 'declined') return 'border-red-200 bg-red-50 text-red-700';
    return 'border-amber-200 bg-amber-50 text-amber-700';
}

export default function StudentSettingsPage() {
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [form, setForm] = useState(blankForm);
    const [boardingHouses, setBoardingHouses] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const syncForm = (s) => setForm({
        first_name:       s.first_name       || '',
        last_name:        s.last_name        || '',
        gender:           s.gender           || '',
        course:           s.course           || '',
        year_level:       s.year_level       || '',
        contact_number:   s.contact_number   || '',
        address:          s.address          || '',
        parent_name:      s.parent_name      || '',
        parent_contact:   s.parent_contact   || '',
        boarding_house_id: s.boarding_house_id ? String(s.boarding_house_id) : '',
    });

    useEffect(() => {
        if (!user?.student_id) {
            setLoading(false);
            return;
        }

        Promise.all([
            api.get(`/students/${user.student_id}`),
            api.get('/find-boarding?per_page=100'),
        ]).then(([studentRes, bhRes]) => {
            const nextStudent = studentRes.data;
            setStudent(nextStudent);
            syncForm(nextStudent);
            setBoardingHouses(bhRes.data?.data || bhRes.data || []);
        }).catch(() => {
            toast.error('Unable to load student settings.');
        }).finally(() => setLoading(false));
    }, [user?.student_id]);

    const set = (field) => (eventOrValue) => {
        const value = eventOrValue?.target?.value ?? eventOrValue;
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!student) return;

        setSaving(true);
        setErrors({});

        try {
            const payload = {
                ...form,
                boarding_house_id: form.boarding_house_id || null,
            };
            const { data } = await api.put(`/students/${student.id}`, payload);
            setStudent(data);
            syncForm(data);
            toast.success('Profile updated successfully.');
        } catch (error) {
            const errs = error.response?.data?.errors || {};
            setErrors(errs);
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="h-48 animate-pulse rounded-xl bg-slate-200" />;
    }

    if (!student) {
        return (
            <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
                <p className="font-medium">Student profile not found.</p>
                <p className="mt-1 text-sm">Your account may still be pending setup. Please contact your administrator.</p>
            </div>
        );
    }

    const approvalStatus = student?.boarding_approval_status || (student?.boarding_house_id ? 'pending' : null);

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                    <UserRound className="h-6 w-6 text-green-600" />
                    Student Settings
                </h1>
                <p className="text-sm text-slate-500">Update your profile and registered boarding house.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Changing your boarding house sends it to that owner for review.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {approvalStatus && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700">Boarding approval:</span>
                                    <Badge className={statusClass(approvalStatus)}>{approvalStatus}</Badge>
                                </div>
                                {student?.boarding_rejection_comment && (
                                    <p className="mt-2 text-sm text-red-600">{student.boarding_rejection_comment}</p>
                                )}
                            </div>
                        )}

                        {student?.has_warning && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <div className="flex items-center gap-2 font-medium text-amber-900">
                                    <AlertTriangle className="h-4 w-4" />
                                    Account warning
                                </div>
                                <p className="mt-1">{student.warning_comment || 'Your student account has a warning comment.'}</p>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>First Name *</Label>
                                <Input value={form.first_name} onChange={set('first_name')} required />
                                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name[0]}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Last Name *</Label>
                                <Input value={form.last_name} onChange={set('last_name')} required />
                                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name[0]}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Gender</Label>
                                <Select value={form.gender} onValueChange={set('gender')}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Contact Number</Label>
                                <Input value={form.contact_number} onChange={set('contact_number')} maxLength={20} />
                                {errors.contact_number && <p className="text-xs text-red-500">{errors.contact_number[0]}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Course</Label>
                                <Input value={form.course} onChange={set('course')} />
                            </div>
                            <div className="space-y-1">
                                <Label>Year Level</Label>
                                <Select value={form.year_level} onValueChange={set('year_level')}>
                                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label>Home Address</Label>
                                <Input value={form.address} onChange={set('address')} placeholder="Purok, Barangay, Municipality" />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label>Registered BH for Reservation</Label>
                                <Select value={String(form.boarding_house_id || '')} onValueChange={(value) => set('boarding_house_id')(value === 'none' ? '' : value)}>
                                    <SelectTrigger><SelectValue placeholder="Select boarding house" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No reservation yet</SelectItem>
                                        {boardingHouses.map((bh) => (
                                            <SelectItem key={bh.id} value={String(bh.id)}>
                                                {bh.boarding_name}{bh.address ? ` - ${bh.address}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.boarding_house_id && <p className="text-xs text-red-500">{errors.boarding_house_id[0]}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Parent / Guardian Name</Label>
                                <Input value={form.parent_name} onChange={set('parent_name')} />
                            </div>
                            <div className="space-y-1">
                                <Label>Parent Contact</Label>
                                <Input value={form.parent_contact} onChange={set('parent_contact')} />
                            </div>
                        </div>

                        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
