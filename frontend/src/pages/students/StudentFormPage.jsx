import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export default function StudentFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        student_no: '', first_name: '', last_name: '', gender: '',
        course: '', year_level: '', contact_number: '',
        parent_name: '', parent_contact: '', boarding_house_id: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [boardingHouses, setBoardingHouses] = useState([]);

    useEffect(() => {
        api.get('/boarding-houses?per_page=100').then(r => setBoardingHouses(r.data.data || []));
        if (isEdit) {
            api.get(`/students/${id}`).then(r => {
                const s = r.data;
                setForm({
                    student_no: s.student_no, first_name: s.first_name, last_name: s.last_name,
                    gender: s.gender || '', course: s.course || '', year_level: s.year_level || '',
                    contact_number: s.contact_number || '', parent_name: s.parent_name || '',
                    parent_contact: s.parent_contact || '', boarding_house_id: s.boarding_house_id || '',
                });
            });
        }
    }, [id]);

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (isEdit) {
                await api.put(`/students/${id}`, form);
                toast.success('Student updated.');
            } else {
                await api.post('/students', form);
                toast.success('Student created.');
            }
            navigate('/students');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                toast.error('Failed to save student.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
                <Link to="/students">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-2xl font-bold">{isEdit ? 'Edit' : 'Add'} Student</h1>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Student ID *</Label>
                                <Input
                                    value={form.student_no}
                                    onChange={set('student_no')}
                                    required
                                    disabled={isEdit}
                                    className={isEdit ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}
                                />
                                {isEdit && <p className="text-xs text-slate-400">Student ID cannot be changed after creation.</p>}
                                {errors.student_no && <p className="text-xs text-red-500">{errors.student_no[0]}</p>}
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
                                <Label>Course</Label>
                                <Input value={form.course} onChange={set('course')} />
                            </div>
                            <div className="space-y-1">
                                <Label>Year Level</Label>
                                <Select value={form.year_level} onValueChange={set('year_level')}>
                                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                    <SelectContent>
                                        {YEAR_LEVELS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Contact Number</Label>
                                <Input value={form.contact_number} onChange={set('contact_number')} />
                            </div>
                            <div className="space-y-1">
                                <Label>Boarding House</Label>
                                <Select value={String(form.boarding_house_id || '')} onValueChange={v => setForm(p => ({ ...p, boarding_house_id: v === 'none' ? '' : v }))}>
                                    <SelectTrigger><SelectValue placeholder="Not assigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Not assigned</SelectItem>
                                        {boardingHouses.map(bh => <SelectItem key={bh.id} value={String(bh.id)}>{bh.boarding_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
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

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Update' : 'Create'} Student
                            </Button>
                            <Link to="/students">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
