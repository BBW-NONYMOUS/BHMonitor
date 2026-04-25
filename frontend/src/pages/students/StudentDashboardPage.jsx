import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    GraduationCap, Home, FileText, Search, MapPin,
    Phone, BookOpen, Calendar, User, Settings2
} from 'lucide-react';

function Field({ label, value, icon: Icon }) {
    return (
        <div className="flex items-start gap-3">
            {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-0.5 text-sm text-slate-900">{value || '—'}</p>
            </div>
        </div>
    );
}

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [docCount, setDocCount] = useState(0);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.student_id) { setLoading(false); return; }
        Promise.all([
            api.get(`/students/${user.student_id}`),
            api.get(`/students/${user.student_id}/documents`),
            api.get('/my-reservations'),
        ]).then(([stuRes, docRes, reservationRes]) => {
            setStudent(stuRes.data);
            setDocCount(docRes.data.length);
            setReservations(reservationRes.data);
        }).finally(() => setLoading(false));
    }, [user?.student_id]);

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        );
    }

    const bh = student?.boarding_house;
    const latestReservation = reservations[0];
    const activeReservations = reservations.filter((reservation) => ['pending', 'contacted', 'approved'].includes(reservation.status)).length;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <GraduationCap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome, {student?.first_name || user.name}!
                        </h1>
                        <p className="text-sm text-slate-500">
                            Student ID: <span className="font-mono font-medium">{student?.student_no || '—'}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="text-center">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-2xl font-bold text-green-600">{docCount}</p>
                        <p className="text-xs text-slate-500 mt-1">Documents</p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-2xl font-bold text-blue-600">{activeReservations}</p>
                        <p className="text-xs text-slate-500 mt-1">Active Reservations</p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardContent className="pt-4 pb-4">
                        <p className="text-2xl font-bold text-slate-700">{student?.year_level?.replace(' Year', '') || '—'}</p>
                        <p className="text-xs text-slate-500 mt-1">Year Level</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4" /> Reservation Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {latestReservation ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium text-slate-900">{latestReservation.boarding_house?.boarding_name || 'Boarding House'}</p>
                                    <p className="text-sm text-slate-500">
                                        Submitted on {new Date(latestReservation.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <Badge variant="outline" className="capitalize">{latestReservation.status}</Badge>
                            </div>
                            <p className="text-sm text-slate-600">
                                {latestReservation.status === 'approved'
                                    ? 'Your reservation was approved. The owner can now assign you to a room.'
                                    : latestReservation.status === 'declined'
                                        ? 'Your latest reservation was declined.'
                                        : 'Your latest reservation is still being reviewed by the owner.'}
                            </p>
                            <Link to="/student-reservations">
                                <Button variant="outline" size="sm">View All Reservations</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-6 text-center">
                            <BookOpen className="mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-sm text-slate-400">You have not made any reservations yet.</p>
                            <Link to="/find-boarding" className="mt-3">
                                <Button size="sm" variant="outline">
                                    <Search className="mr-2 h-4 w-4" />
                                    Reserve a Boarding House
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Profile */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4" /> My Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Field label="Full Name" value={student ? `${student.first_name} ${student.last_name}` : user.name} icon={User} />
                        <Field label="Course" value={student?.course} icon={BookOpen} />
                        <Field label="Year Level" value={student?.year_level} icon={Calendar} />
                        <Field label="Contact" value={student?.contact_number} icon={Phone} />
                        <Field label="Gender" value={student?.gender} icon={User} />
                    </CardContent>
                </Card>

                {/* Boarding House */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Home className="h-4 w-4" /> My Boarding House
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bh ? (
                            <div className="space-y-3">
                                <Badge variant="success">Assigned</Badge>
                                <Field label="Boarding House" value={bh.boarding_name} icon={Home} />
                                <Field label="Address" value={bh.address} icon={MapPin} />
                                <Field label="Owner" value={bh.owner?.full_name} icon={User} />
                                <Field label="Approval" value={student?.boarding_approval_status} icon={User} />
                                <Field
                                    label="Monthly Rate"
                                    value={bh.room_rate ? `₱${Number(bh.room_rate).toLocaleString()}/mo` : null}
                                    icon={Calendar}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-6 text-center">
                                <Home className="mb-2 h-8 w-8 text-slate-300" />
                                <Badge variant="secondary">Not Assigned</Badge>
                                <p className="mt-2 text-sm text-slate-400">You have no boarding house assigned yet.</p>
                                <Link to="/find-boarding" className="mt-3">
                                    <Button size="sm" variant="outline">
                                        <Search className="mr-2 h-4 w-4" />
                                        Find Boarding House
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Link to="/student-documents">
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                My Documents
                                {docCount > 0 && (
                                    <Badge variant="secondary" className="ml-auto">{docCount}</Badge>
                                )}
                            </Button>
                        </Link>
                        <Link to="/student-settings">
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Settings2 className="h-4 w-4 text-slate-500" />
                                Account Settings
                            </Button>
                        </Link>
                        <Link to="/find-boarding" target="_blank">
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Search className="h-4 w-4 text-green-500" />
                                Find Boarding House
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
