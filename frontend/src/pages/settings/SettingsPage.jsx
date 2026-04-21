import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Progress,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import {
    BadgeCheck,
    Camera,
    KeyRound,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    Sparkles,
    Upload,
    UserRound,
} from 'lucide-react';

function buildForm(user) {
    return {
        name: user?.name ?? '',
        full_name: user?.full_name ?? user?.name ?? '',
        email: user?.email ?? '',
        contact_number: user?.contact_number ?? '',
        address: user?.address ?? '',
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    };
}

function getStatusClasses(status) {
    if (status === 'approved') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'pending') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    if (status === 'rejected') {
        return 'border-red-200 bg-red-50 text-red-700';
    }

    return 'border-slate-200 bg-slate-100 text-slate-700';
}

function SettingsSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
                <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
                <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
                <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
            </div>
            <div className="space-y-6">
                <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
                <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { user, syncUser } = useAuth();
    const [form, setForm] = useState(() => buildForm(user));
    const [errors, setErrors] = useState({});
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(user?.profile_photo_url ?? null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isOwner = user?.role === 'owner';

    useEffect(() => {
        let active = true;

        api.get('/user')
            .then(({ data }) => {
                if (!active) {
                    return;
                }

                syncUser(data);
                setForm(buildForm(data));
                setPhotoPreview(data.profile_photo_url ?? null);
            })
            .catch(() => {
                if (active) {
                    toast.error('Unable to load your settings right now.');
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (photoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const profileChecks = useMemo(() => {
        const items = [
            { label: 'Display name', complete: Boolean(form.name.trim()) },
            { label: 'Email address', complete: Boolean(form.email.trim()) },
            { label: 'Profile photo', complete: Boolean(photoPreview) },
            { label: 'Contact number', complete: Boolean(form.contact_number.trim()) },
        ];

        if (isOwner) {
            items.push({ label: 'Owner full name', complete: Boolean(form.full_name.trim()) });
            items.push({ label: 'Business address', complete: Boolean(form.address.trim()) });
        }

        return items;
    }, [form, isOwner, photoPreview]);

    const completion = Math.round(
        (profileChecks.filter((item) => item.complete).length / profileChecks.length) * 100
    );

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setErrors((current) => ({
            ...current,
            [name]: undefined,
        }));
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (photoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview);
        }

        setSelectedPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        setErrors((current) => ({
            ...current,
            profile_photo: undefined,
        }));
    };

    const handleReset = () => {
        setForm(buildForm(user));
        setErrors({});
        setSelectedPhoto(null);

        if (photoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(photoPreview);
        }

        setPhotoPreview(user?.profile_photo_url ?? null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setErrors({});

        const payload = new FormData();
        payload.append('name', form.name);
        payload.append('email', form.email);
        payload.append('current_password', form.current_password);
        payload.append('new_password', form.new_password);
        payload.append('new_password_confirmation', form.new_password_confirmation);

        if (isOwner) {
            payload.append('full_name', form.full_name);
            payload.append('contact_number', form.contact_number);
            payload.append('address', form.address);
        }

        if (selectedPhoto) {
            payload.append('profile_photo', selectedPhoto);
        }

        try {
            const { data } = await api.post('/profile/update', payload);
            const nextUser = data.user ?? data;

            syncUser(nextUser);
            setForm(buildForm(nextUser));
            setSelectedPhoto(null);

            if (photoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }

            setPhotoPreview(nextUser.profile_photo_url ?? null);
            toast.success(data.message ?? 'Settings updated successfully.');
        } catch (error) {
            setErrors(error.response?.data?.errors ?? {});
            toast.error(error.response?.data?.message ?? 'Failed to update settings.');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return null;
    }

    if (user.role === 'student') {
        return <Navigate to="/student-dashboard" replace />;
    }

    if (loading) {
        return <SettingsSkeleton />;
    }

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(135deg,#0f172a_0%,#1459c7_48%,#7dd3fc_100%)]" />
                <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)] lg:p-8">
                    <div className="flex flex-col gap-4 pt-16 sm:flex-row sm:items-end">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-lg">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-semibold text-slate-500">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border border-white/50 bg-white/85 text-slate-900 shadow-sm">
                                    {user.role === 'admin' ? 'Administrator' : 'Owner'}
                                </Badge>
                                <Badge className={getStatusClasses(user.account_status)}>
                                    {user.account_status ?? 'approved'}
                                </Badge>
                                {user.google_linked && (
                                    <Badge className="border border-sky-200 bg-sky-50 text-sky-700">
                                        Google linked
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                                    Account Settings
                                </h1>
                                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                                    Update your account profile, credentials, and profile image from one place.
                                    Owners can also maintain their contact details and account identity here.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Contact email
                            </p>
                            <p className="mt-2 truncate text-sm font-medium text-slate-900">{form.email}</p>
                            <p className="mt-2 text-xs text-slate-500">
                                Keep this current so password resets and approvals reach you.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Security
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                                {form.new_password ? 'Password change ready to save' : 'Password unchanged'}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Use your current password before saving a new one.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
                <div className="space-y-6">
                    <Card className="rounded-[28px] border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <UserRound className="h-5 w-5 text-blue-600" />
                                Profile Details
                            </CardTitle>
                            <CardDescription>
                                Keep the information shown around the dashboard accurate and professional.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Display name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter your display name"
                                        />
                                        {errors.name && <p className="text-sm text-red-600">{errors.name[0]}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                        />
                                        {errors.email && <p className="text-sm text-red-600">{errors.email[0]}</p>}
                                    </div>
                                </div>

                                {isOwner && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Full name</Label>
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                value={form.full_name}
                                                onChange={handleChange}
                                                placeholder="Enter your full name"
                                            />
                                            {errors.full_name && (
                                                <p className="text-sm text-red-600">{errors.full_name[0]}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_number">Contact number</Label>
                                            <Input
                                                id="contact_number"
                                                name="contact_number"
                                                value={form.contact_number}
                                                onChange={handleChange}
                                                placeholder="Enter your contact number"
                                            />
                                            {errors.contact_number && (
                                                <p className="text-sm text-red-600">{errors.contact_number[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isOwner && (
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            rows={4}
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="Enter your business or correspondence address"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.address && <p className="text-sm text-red-600">{errors.address[0]}</p>}
                                    </div>
                                )}

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="h-4 w-4 text-slate-500" />
                                        <p className="text-sm font-semibold text-slate-900">Password update</p>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Leave the password fields blank if you do not want to change them.
                                    </p>

                                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="current_password">Current password</Label>
                                            <Input
                                                id="current_password"
                                                name="current_password"
                                                type="password"
                                                value={form.current_password}
                                                onChange={handleChange}
                                                placeholder="Current password"
                                            />
                                            {errors.current_password && (
                                                <p className="text-sm text-red-600">{errors.current_password[0]}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new_password">New password</Label>
                                            <Input
                                                id="new_password"
                                                name="new_password"
                                                type="password"
                                                value={form.new_password}
                                                onChange={handleChange}
                                                placeholder="New password"
                                            />
                                            {errors.new_password && (
                                                <p className="text-sm text-red-600">{errors.new_password[0]}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new_password_confirmation">Confirm password</Label>
                                            <Input
                                                id="new_password_confirmation"
                                                name="new_password_confirmation"
                                                type="password"
                                                value={form.new_password_confirmation}
                                                onChange={handleChange}
                                                placeholder="Confirm password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                                    <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
                                        Reset
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        <Save className="h-4 w-4" />
                                        {saving ? 'Saving...' : 'Save settings'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-[28px] border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Camera className="h-5 w-5 text-blue-600" />
                                Profile Image
                            </CardTitle>
                            <CardDescription>
                                Upload a clear account image for the sidebar and account views.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-semibold text-slate-400">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Recommended: square image, max 5MB</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        JPG, PNG, and other standard image formats are accepted.
                                    </p>
                                </div>
                                <label
                                    htmlFor="profile_photo"
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                >
                                    <Upload className="h-4 w-4" />
                                    Choose image
                                </label>
                                <input
                                    id="profile_photo"
                                    name="profile_photo"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />
                                {selectedPhoto && (
                                    <p className="text-xs font-medium text-slate-500">{selectedPhoto.name}</p>
                                )}
                                {errors.profile_photo && (
                                    <p className="text-sm text-red-600">{errors.profile_photo[0]}</p>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Current role
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-900">
                                        {user.role === 'admin' ? 'System administrator' : 'Boarding house owner'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                                Settings Checklist
                            </CardTitle>
                            <CardDescription>
                                A quick view of what is complete and what still needs attention.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {profileChecks.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.complete ? (
                                            <BadgeCheck className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                                        )}
                                        <span className="text-sm text-slate-700">{item.label}</span>
                                    </div>
                                    <Badge
                                        className={
                                            item.complete
                                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border border-slate-200 bg-slate-100 text-slate-700'
                                        }
                                    >
                                        {item.complete ? 'Ready' : 'Missing'}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]">
                        <CardHeader>
                            <CardTitle className="text-xl">Account Summary</CardTitle>
                            <CardDescription>
                                Snapshot of the account details currently attached to your login.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                                <Mail className="mt-0.5 h-4 w-4 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Email</p>
                                    <p className="text-sm text-slate-600">{form.email || 'No email set'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                                <Phone className="mt-0.5 h-4 w-4 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Contact number</p>
                                    <p className="text-sm text-slate-600">{form.contact_number || 'No contact number set'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                                <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Address</p>
                                    <p className="text-sm text-slate-600">
                                        {isOwner ? (form.address || 'No address set') : 'Admin accounts use basic account details only.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
