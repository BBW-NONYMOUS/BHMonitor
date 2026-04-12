import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Loader2, ArrowLeft } from 'lucide-react';

export default function RegisterOwnerPage() {
    const { registerOwner } = useAuth();
    const navigate = useNavigate();
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

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await registerOwner(form);
            toast.success('Registration successful! Welcome to Boarders Monitor.');
            navigate('/dashboard');
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
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                                    Account Information
                                </h3>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="name">Username</Label>
                                        <Input
                                            id="name"
                                            placeholder="johndoe"
                                            value={form.name}
                                            onChange={handleChange('name')}
                                            required
                                        />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={form.email}
                                            onChange={handleChange('email')}
                                            required
                                        />
                                        {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter password"
                                            value={form.password}
                                            onChange={handleChange('password')}
                                            required
                                        />
                                        {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            placeholder="Confirm password"
                                            value={form.password_confirmation}
                                            onChange={handleChange('password_confirmation')}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                                    Owner Information
                                </h3>

                                <div className="space-y-1">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        placeholder="Juan Dela Cruz"
                                        value={form.full_name}
                                        onChange={handleChange('full_name')}
                                        required
                                    />
                                    {errors.full_name && <p className="text-xs text-red-500">{errors.full_name[0]}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="contact_number">Contact Number</Label>
                                    <Input
                                        id="contact_number"
                                        placeholder="09171234567"
                                        value={form.contact_number}
                                        onChange={handleChange('contact_number')}
                                    />
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
                                {loading ? 'Creating Account...' : 'Create Account'}
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
