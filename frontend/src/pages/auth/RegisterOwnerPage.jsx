import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Loader2, ArrowLeft, Camera, X, CheckCircle, Clock } from 'lucide-react';
import { redirectToGoogleAuth } from '@/lib/googleAuth';

export default function RegisterOwnerPage() {
    const { registerOwner } = useAuth();
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        full_name: '',
        contact_number: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [registered, setRegistered] = useState(false);
    const photoInputRef = useRef(null);

    useEffect(() => {
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        if (email || name) {
            setForm((prev) => ({
                ...prev,
                email: email || prev.email,
                name: (name || '').split(' ')[0].toLowerCase() || prev.name,
                full_name: name || prev.full_name,
            }));
        }
    }, [searchParams]);

    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        return () => {
            if (photoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

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
        if (photoPreview?.startsWith('blob:')) {
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
            let payload;
            if (profilePhoto) {
                payload = new FormData();
                Object.entries(form).forEach(([k, v]) => {
                    if (v !== '') payload.append(k, v);
                });
                payload.append('profile_photo', profilePhoto);
            } else {
                payload = form;
            }

            await registerOwner(payload);
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
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 p-4">
                <div className="w-full max-w-md">
                    <Card className="text-center shadow-2xl">
                        <CardContent className="space-y-4 pt-10 pb-10">
                            <div className="flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Registration Submitted</h2>
                            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
                                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                                <div>
                                    <p className="font-semibold">Awaiting Admin Approval</p>
                                    <p className="mt-1">Your owner account has been submitted and is pending approval.</p>
                                </div>
                            </div>
                            <Link to="/login">
                                <Button className="mt-2 w-full">Back to Login</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 p-4">
            <div className="w-full max-w-lg">
                <Link to="/" className="mb-6 inline-flex items-center text-blue-300 transition-colors hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>

                <div className="mb-8 flex justify-center">
                    <div className="flex items-center gap-3 text-white">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                            <Home className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">Boarders Monitor</p>
                            <p className="text-sm text-blue-300">Owner Registration</p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Register as Owner</CardTitle>
                        <CardDescription>
                            Create an account to list and manage your boarding houses.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <button
                            type="button"
                            onClick={redirectToGoogleAuth}
                            className="mb-4 flex w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </button>
                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400">or register with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                                    Account Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="name">Username</Label>
                                        <Input id="name" placeholder="johndoe" value={form.name} onChange={handleChange('name')} required />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange('email')} required />
                                        {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" type="password" placeholder="Enter password" value={form.password} onChange={handleChange('password')} required />
                                        {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                                        <Input id="password_confirmation" type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={handleChange('password_confirmation')} required />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                                    Owner Information
                                </h3>

                                <div className="flex items-center gap-4 py-2">
                                    <div className="relative">
                                        {photoPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={photoPreview}
                                                    alt="Profile preview"
                                                    className="h-20 w-20 rounded-full border-2 border-blue-200 object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removePhoto}
                                                    className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-100">
                                                <Camera className="h-8 w-8 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-sm font-medium">Profile Photo</Label>
                                        <p className="mb-2 text-xs text-slate-500">Optional. Max 5MB. JPG or PNG.</p>
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

                                <div className="space-y-1">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input id="full_name" placeholder="Juan Dela Cruz" value={form.full_name} onChange={handleChange('full_name')} required />
                                    {errors.full_name && <p className="text-xs text-red-500">{errors.full_name[0]}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="contact_number">Contact Number</Label>
                                    <Input id="contact_number" placeholder="09171234567" value={form.contact_number} onChange={handleChange('contact_number')} />
                                    {errors.contact_number && <p className="text-xs text-red-500">{errors.contact_number[0]}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="address">Address</Label>
                                    <textarea
                                        id="address"
                                        placeholder="Enter your complete address"
                                        value={form.address}
                                        onChange={handleChange('address')}
                                        rows={2}
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.address && <p className="text-xs text-red-500">{errors.address[0]}</p>}
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Submitting...' : 'Create Account'}
                            </Button>

                            <p className="text-center text-sm text-slate-500">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-blue-600 hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
