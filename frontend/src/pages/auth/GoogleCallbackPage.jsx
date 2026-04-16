import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, Loader2, XCircle } from 'lucide-react';

export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | pending | rejected | new | error
    const [message, setMessage] = useState('');
    const [googleData, setGoogleData] = useState({ name: '', email: '' });

    useEffect(() => {
        const googleStatus = searchParams.get('status');

        console.log('Google callback params:', Object.fromEntries(searchParams));

        if (!googleStatus) {
            setStatus('error');
            setMessage('No status returned from Google. Please try again.');
            return;
        }

        if (googleStatus === 'success') {
            const token = searchParams.get('token');
            const userB64 = searchParams.get('user');
            try {
                if (!token || !userB64) {
                    throw new Error('Missing token or user data');
                }
                const user = JSON.parse(atob(userB64));
                loginWithToken(token, user);
                toast.success('Signed in with Google!');
                navigate(user.role === 'student' ? '/student-dashboard' : '/dashboard', { replace: true });
            } catch (e) {
                console.error('Google login error:', e);
                setStatus('error');
                setMessage('Failed to process Google login. Please try again.');
            }
            return;
        }

        if (googleStatus === 'pending') {
            setStatus('pending');
            setMessage(searchParams.get('message') || 'Your account is pending admin approval.');
            return;
        }

        if (googleStatus === 'rejected') {
            setStatus('rejected');
            setMessage(searchParams.get('message') || 'Your account has been rejected.');
            return;
        }

        if (googleStatus === 'new') {
            setGoogleData({
                name:  searchParams.get('name')  || '',
                email: searchParams.get('email') || '',
            });
            setStatus('new');
            return;
        }

        // error or unexpected status
        setStatus('error');
        setMessage(searchParams.get('message') || `Google authentication failed with status: ${googleStatus}`);
    }, [searchParams]);

    const goToRegister = (role) => {
        const params = new URLSearchParams({ email: googleData.email, name: googleData.name });
        navigate(`/register-${role}?${params.toString()}`);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-2xl">
                    <CardContent className="pt-10 pb-10 space-y-5 text-center">

                        {/* Pending */}
                        {status === 'pending' && (
                            <>
                                <Clock className="h-14 w-14 text-amber-500 mx-auto" />
                                <h2 className="text-xl font-bold text-slate-900">Account Pending Approval</h2>
                                <p className="text-sm text-slate-600">{message}</p>
                                <Link to="/login"><Button className="w-full">Back to Login</Button></Link>
                            </>
                        )}

                        {/* Rejected */}
                        {status === 'rejected' && (
                            <>
                                <XCircle className="h-14 w-14 text-red-500 mx-auto" />
                                <h2 className="text-xl font-bold text-slate-900">Account Rejected</h2>
                                <p className="text-sm text-slate-600">{message}</p>
                                <Link to="/login"><Button className="w-full">Back to Login</Button></Link>
                            </>
                        )}

                        {/* Error */}
                        {status === 'error' && (
                            <>
                                <AlertCircle className="h-14 w-14 text-red-500 mx-auto" />
                                <h2 className="text-xl font-bold text-slate-900">Authentication Error</h2>
                                <p className="text-sm text-slate-600">{message}</p>
                                <Link to="/login"><Button className="w-full">Back to Login</Button></Link>
                            </>
                        )}

                        {/* New Google user — choose role */}
                        {status === 'new' && (
                            <>
                                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                                    <svg className="h-7 w-7" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Complete Registration</h2>
                                <p className="text-sm text-slate-600">
                                    No account found for <span className="font-medium">{googleData.email}</span>.
                                    Choose your role to continue registration with your Google info pre-filled.
                                </p>
                                <div className="space-y-3 pt-2">
                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => goToRegister('student')}>
                                        Register as Student
                                    </Button>
                                    <Button className="w-full" onClick={() => goToRegister('owner')}>
                                        Register as Boarding House Owner
                                    </Button>
                                </div>
                                <Link to="/login" className="text-xs text-slate-400 hover:underline block pt-1">
                                    Back to Login
                                </Link>
                            </>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
