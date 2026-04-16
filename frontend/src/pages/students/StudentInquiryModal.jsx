import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2, LogIn, Calendar, MessageSquare, GraduationCap, User, MapPin } from 'lucide-react';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];

export default function StudentInquiryModal({ open, onClose, boardingHouse }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        year_level: '',
        move_in_date: '',
        message: '',
    });

    const handleChange = (field) => (e) => {
        const value = e?.target?.value ?? e;
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/student-inquiries', {
                ...form,
                boarding_house_id: boardingHouse.id,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit reservation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setForm({ year_level: '', move_in_date: '', message: '' });
            setSuccess(false);
            setError('');
            onClose();
        }
    };

    if (!boardingHouse) return null;

    // Guest: prompt to log in
    if (!user) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-sm">
                    <div className="text-center py-6">
                        <LogIn className="h-14 w-14 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Sign in to Reserve</h3>
                        <p className="text-slate-500 mb-6 text-sm">
                            You need an account to submit a reservation for{' '}
                            <span className="font-medium">{boardingHouse.boarding_name}</span>.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                className="w-full"
                                onClick={() => navigate('/login', { state: { from: window.location.pathname } })}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/register-student')}
                            >
                                Create an Account
                            </Button>
                            <Button variant="ghost" onClick={handleClose} className="w-full text-slate-400">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                {success ? (
                    <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Reservation Submitted!</h3>
                        <p className="text-slate-500 mb-6">
                            Your reservation for <span className="font-medium">{boardingHouse.boarding_name}</span> has been sent to the owner. They will contact you soon.
                        </p>
                        <Button onClick={handleClose}>Close</Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Reserve a Room</DialogTitle>
                            <DialogDescription>
                                Reserving at <span className="font-medium text-slate-700">{boardingHouse.boarding_name}</span>.
                                Your account information will be sent automatically to the owner.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            {/* Auto-filled account info — read-only preview */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                                    Your Information (from your account)
                                </p>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span>{user.name}</span>
                                </div>
                                {user.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <span className="h-4 w-4 text-slate-400 flex items-center justify-center text-xs">@</span>
                                        <span>{user.email}</span>
                                    </div>
                                )}
                                {user.address && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                                        <span>{user.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Year Level */}
                            <div className="space-y-1">
                                <Label htmlFor="year_level" className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Year Level *
                                </Label>
                                <Select value={form.year_level} onValueChange={handleChange('year_level')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your year level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEAR_LEVELS.map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Move-in Date */}
                            <div className="space-y-1">
                                <Label htmlFor="move_in_date" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Preferred Move-in Date
                                </Label>
                                <Input
                                    id="move_in_date"
                                    type="date"
                                    value={form.move_in_date}
                                    onChange={handleChange('move_in_date')}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-1">
                                <Label htmlFor="message" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Message to Owner
                                </Label>
                                <textarea
                                    id="message"
                                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Any questions or additional information you'd like to share..."
                                    value={form.message}
                                    onChange={handleChange('message')}
                                    rows={3}
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading || !form.year_level} className="flex-1">
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Reservation'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
