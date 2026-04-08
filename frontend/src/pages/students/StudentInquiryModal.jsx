import React, { useState } from 'react';
import api from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Loader2, Send, User, Phone, Mail, GraduationCap, Calendar, MessageSquare } from 'lucide-react';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];
const GENDER_OPTIONS = ['Male', 'Female'];

export default function StudentInquiryModal({ open, onClose, boardingHouse }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        contact_number: '',
        student_no: '',
        course: '',
        year_level: '',
        gender: '',
        message: '',
        preferred_room_type: '',
        budget: '',
        move_in_date: '',
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
                budget: form.budget ? parseFloat(form.budget) : null,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setForm({
                full_name: '',
                email: '',
                contact_number: '',
                student_no: '',
                course: '',
                year_level: '',
                gender: '',
                message: '',
                preferred_room_type: '',
                budget: '',
                move_in_date: '',
            });
            setSuccess(false);
            setError('');
            onClose();
        }
    };

    if (!boardingHouse) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                {success ? (
                    <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Inquiry Submitted!</h3>
                        <p className="text-slate-500 mb-6">
                            Your inquiry for <span className="font-medium">{boardingHouse.boarding_name}</span> has been sent to the owner. They will contact you soon.
                        </p>
                        <Button onClick={handleClose}>Close</Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Send Inquiry</DialogTitle>
                            <DialogDescription>
                                Interested in <span className="font-medium text-slate-700">{boardingHouse.boarding_name}</span>? 
                                Fill out the form below and the owner will get back to you.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            {/* Personal Information */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Personal Information
                                </h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="full_name">Full Name *</Label>
                                        <Input
                                            id="full_name"
                                            placeholder="Juan Dela Cruz"
                                            value={form.full_name}
                                            onChange={handleChange('full_name')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="gender">Gender</Label>
                                        <Select value={form.gender} onValueChange={handleChange('gender')}>
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={form.email}
                                            onChange={handleChange('email')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="contact_number">Contact Number *</Label>
                                        <Input
                                            id="contact_number"
                                            placeholder="09XX XXX XXXX"
                                            value={form.contact_number}
                                            onChange={handleChange('contact_number')}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Student Information */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Student Information (Optional)
                                </h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="student_no">Student Number</Label>
                                        <Input
                                            id="student_no"
                                            placeholder="e.g., 2024-00001"
                                            value={form.student_no}
                                            onChange={handleChange('student_no')}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="course">Course/Program</Label>
                                        <Input
                                            id="course"
                                            placeholder="e.g., BSIT"
                                            value={form.course}
                                            onChange={handleChange('course')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="year_level">Year Level</Label>
                                    <Select value={form.year_level} onValueChange={handleChange('year_level')}>
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

                            {/* Preferences */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm text-slate-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Preferences
                                </h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="budget">Budget (₱/month)</Label>
                                        <Input
                                            id="budget"
                                            type="number"
                                            placeholder="e.g., 2000"
                                            value={form.budget}
                                            onChange={handleChange('budget')}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="move_in_date">Preferred Move-in Date</Label>
                                        <Input
                                            id="move_in_date"
                                            type="date"
                                            value={form.move_in_date}
                                            onChange={handleChange('move_in_date')}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="preferred_room_type">Preferred Room Type</Label>
                                    <Select value={form.preferred_room_type} onValueChange={handleChange('preferred_room_type')}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any room type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single Room</SelectItem>
                                            <SelectItem value="shared">Shared Room</SelectItem>
                                            <SelectItem value="any">Any</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <Label htmlFor="message" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Message to Owner
                                </Label>
                                <textarea
                                    id="message"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
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
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Inquiry
                                        </>
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
