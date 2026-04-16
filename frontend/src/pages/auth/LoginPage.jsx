import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, Loader2, Clock, XCircle } from 'lucide-react';
import { redirectToGoogleAuth } from '@/lib/googleAuth';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [accountStatus, setAccountStatus] = useState(null); // 'pending' | 'rejected'
    const [statusMessage, setStatusMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setAccountStatus(null);

        try {
            const user = await login(form.email, form.password);
            toast.success('Welcome back!');
            navigate(user.role === 'student' ? '/student-dashboard' : '/dashboard');
        } catch (err) {
            const status = err.response?.data?.account_status;
            const message = err.response?.data?.message;

            if (status === 'pending' || status === 'rejected') {
                setAccountStatus(status);
                setStatusMessage(message || '');
            } else if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                toast.error(message || 'Login failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3 text-white">
                        <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Home className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">Boarders Monitor</p>
                            <p className="text-sm text-blue-300">SKSU Kalamansig Campus</p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">Sign In</CardTitle>
                        <CardDescription>Enter your credentials to access the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Account status banners */}
                        {accountStatus === 'pending' && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <Clock className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Account Pending Approval</p>
                                    <p className="mt-1 text-amber-700">{statusMessage}</p>
                                </div>
                            </div>
                        )}

                        {accountStatus === 'rejected' && (
                            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                <XCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Account Rejected</p>
                                    <p className="mt-1 text-red-700">{statusMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Google sign-in */}
                        <button
                            type="button"
                            onClick={redirectToGoogleAuth}
                            className="w-full flex items-center justify-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors mb-4"
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
                                <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider">or sign in with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    required
                                    autoFocus
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    required
                                />
                                {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>

                            <div className="space-y-2 text-center text-sm text-slate-500">
                                <p>
                                    Boarding house owner?{' '}
                                    <a href="/register-owner" className="text-blue-600 hover:underline font-medium">
                                        Register here
                                    </a>
                                </p>
                                <p>
                                    Student?{' '}
                                    <a href="/register-student" className="text-green-600 hover:underline font-medium">
                                        Create student account
                                    </a>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
