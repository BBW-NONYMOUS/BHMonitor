import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, GraduationCap, CheckCircle, Clock, Camera, X } from 'lucide-react';
import { redirectToGoogleAuth } from '@/lib/googleAuth';

const limitContactNumber = (value) => value.replace(/\D/g, '').slice(0, 11);

export default function RegisterStudentPage() {
    const { registerStudent } = useAuth();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({
        student_no: '', first_name: '', last_name: '',
        email: '', password: '', password_confirmation: '',
        gender: '', course: '', year_level: '', contact_number: '', address: '',
        parent_name: '', parent_contact: '', boarding_house_id: '',
    });
    const [boardingHouses, setBoardingHouses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [registered, setRegistered] = useState(false);
    const [registrationResult, setRegistrationResult] = useState(null);
    const photoInputRef = useRef(null);

    // Pre-fill from Google OAuth redirect (?email=...&name=...)
    useEffect(() => {
        const email = searchParams.get('email');
        const name  = searchParams.get('name');
        if (email || name) {
            const parts = (name || '').trim().split(' ');
            setForm(p => ({
                ...p,
                email:      email || p.email,
                first_name: parts[0] || p.first_name,
                last_name:  parts.slice(1).join(' ') || p.last_name,
            }));
        }
    }, [searchParams]);

    useEffect(() => {
        api.get('/find-boarding?per_page=100')
            .then(({ data }) => setBoardingHouses(data?.data || []))
            .catch(() => setBoardingHouses([]));
    }, []);

    // Profile photo state - REQ-002
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        return () => {
            if (photoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const set = (field) => (e) => {
        setForm(p => ({ ...p, [field]: e.target?.value ?? e }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
    };

    const setContactNumber = (e) => {
        setForm(p => ({ ...p, contact_number: limitContactNumber(e.target.value) }));
        if (errors.contact_number) setErrors(p => ({ ...p, contact_number: null }));
    };

    // Handle profile photo selection - REQ-002
    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            e.target.value = '';
            return;
        }

        if (photoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview);
        }

        setProfilePhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const openPhotoPicker = () => {
        photoInputRef.current?.click();
    };

    const removePhoto = () => {
        if (photoPreview && photoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview);
        }
        setProfilePhoto(null);
        setPhotoPreview(null);
        if (photoInputRef.current) {
            photoInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            // Use FormData if there's a profile photo
            let payload;
            if (profilePhoto) {
                payload = new FormData();
                Object.entries(form).forEach(([k, v]) => { if (v !== '') payload.append(k, v); });
                payload.append('profile_photo', profilePhoto);
            } else {
                payload = {
                    ...form,
                    boarding_house_id: form.boarding_house_id || null,
                    gender: form.gender || null,
                    year_level: form.year_level || null,
                    course: form.course || null,
                    address: form.address || null,
                    contact_number: form.contact_number || null,
                    parent_name: form.parent_name || null,
                    parent_contact: form.parent_contact || null,
                };
            }

            const result = await registerStudent(payload);
            setRegistrationResult(result);
            setRegistered(true);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (registered) {
        const isOwnerReview = registrationResult?.approval_reviewer === 'owner';

        return (
            <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 to-green-900 p-4">
                <div className="w-full max-w-md">
                    <Card className="shadow-2xl text-center">
                        <CardContent className="pt-10 pb-10 space-y-4">
                            <div className="flex justify-center">
                                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Registration Submitted!</h2>
                            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
                                <Clock className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{isOwnerReview ? 'Awaiting Owner Approval' : 'Awaiting Admin Approval'}</p>
                                    <p className="mt-1">
                                        {registrationResult?.message || 'Your account has been submitted and is pending review.'}
                                    </p>
                                </div>
                            </div>
                            <Link to="/login">
                                <Button className="w-full mt-2">Back to Login</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 to-green-900 p-4">
            <div className="w-full max-w-lg">
                <Link to="/login" className="mb-6 inline-flex items-center text-green-300 hover:text-white transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Link>

                <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-3 text-white">
                        <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">Boarders Monitor</p>
                            <p className="text-sm text-green-300">Student Registration — SKSU Kalamansig</p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Create Student Account</CardTitle>
                        <CardDescription>Register your account, school details, contacts, and boarding house.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Google register */}
                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Account Info */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account Information</h3>
                                <div className="space-y-1">
                                    <Label>Student ID *</Label>
                                    <Input placeholder="e.g. 2021-00123" value={form.student_no} onChange={set('student_no')} required />
                                    {errors.student_no && <p className="text-xs text-red-500">{errors.student_no[0]}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label>Email *</Label>
                                    <Input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>Password *</Label>
                                        <Input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
                                        {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Confirm Password *</Label>
                                        <Input type="password" placeholder="Repeat password" value={form.password_confirmation} onChange={set('password_confirmation')} required />
                                    </div>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="space-y-3 border-t pt-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Personal Information</h3>

                                {/* Profile Photo Upload - REQ-002 */}
                                <div className="flex items-center gap-4 py-2">
                                    <div className="relative">
                                        {photoPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={photoPreview}
                                                    alt="Profile preview"
                                                    className="h-20 w-20 rounded-full object-cover border-2 border-green-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removePhoto}
                                                    className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                                                <Camera className="h-8 w-8 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-sm font-medium">Profile Photo</Label>
                                        <p className="text-xs text-slate-500 mb-2">Optional. Max 5MB. JPG or PNG.</p>
                                        <input
                                            ref={photoInputRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,image/*"
                                            className="hidden"
                                            onChange={handlePhotoSelect}
                                        />
                                        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={openPhotoPicker}>
                                            <Camera className="h-4 w-4" />
                                            {photoPreview ? 'Change Photo' : 'Add Photo'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>First Name *</Label>
                                        <Input placeholder="Juan" value={form.first_name} onChange={set('first_name')} required />
                                        {errors.first_name && <p className="text-xs text-red-500">{errors.first_name[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Last Name *</Label>
                                        <Input placeholder="Dela Cruz" value={form.last_name} onChange={set('last_name')} required />
                                        {errors.last_name && <p className="text-xs text-red-500">{errors.last_name[0]}</p>}
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>Gender</Label>
                                        <Select value={form.gender} onValueChange={set('gender')}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-3 border-t pt-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Details</h3>
                                <div className="space-y-1">
                                    <Label>Contact Number</Label>
                                    <Input
                                        placeholder="09171234567"
                                        value={form.contact_number}
                                        onChange={setContactNumber}
                                        inputMode="numeric"
                                        maxLength={11}
                                    />
                                    {errors.contact_number && <p className="text-xs text-red-500">{errors.contact_number[0]}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label>Home Address</Label>
                                    <Input placeholder="Purok, Barangay, Municipality" value={form.address} onChange={set('address')} />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>Parent / Guardian Name</Label>
                                        <Input placeholder="Guardian full name" value={form.parent_name} onChange={set('parent_name')} />
                                        {errors.parent_name && <p className="text-xs text-red-500">{errors.parent_name[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Parent Contact</Label>
                                        <Input placeholder="Guardian contact number" value={form.parent_contact} onChange={set('parent_contact')} maxLength={20} />
                                        {errors.parent_contact && <p className="text-xs text-red-500">{errors.parent_contact[0]}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* School Info */}
                            <div className="space-y-3 border-t pt-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">School Information</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>Course</Label>
                                        <Input placeholder="e.g. BSIT" value={form.course} onChange={set('course')} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Year Level</Label>
                                        <Select value={form.year_level} onValueChange={set('year_level')}>
                                            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                            <SelectContent>
                                                {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map(y => (
                                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Boarding House Info */}
                            <div className="space-y-3 border-t pt-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Boarding House Information</h3>
                                <div className="space-y-1">
                                    <Label>Boarding House</Label>
                                    <Select value={String(form.boarding_house_id || '')} onValueChange={(value) => set('boarding_house_id')(value === 'none' ? '' : value)}>
                                        <SelectTrigger><SelectValue placeholder="Select your current boarding house" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No boarding house yet</SelectItem>
                                            {boardingHouses.map((bh) => (
                                                <SelectItem key={bh.id} value={String(bh.id)}>
                                                    {bh.boarding_name}{bh.address ? ` - ${bh.address}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.boarding_house_id && <p className="text-xs text-red-500">{errors.boarding_house_id[0]}</p>}
                                    <p className="text-xs text-slate-500">The selected boarding house owner can accept or reject your registration.</p>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Submitting...' : 'Submit Registration'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
