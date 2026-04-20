import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calendar, CheckCircle, Clock, Home, MapPin, Search, XCircle } from 'lucide-react';

const STATUS_META = {
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    contacted: { label: 'Contacted', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
    approved: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
    declined: { label: 'Declined', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    cancelled: { label: 'Cancelled', className: 'bg-slate-50 text-slate-700 border-slate-200', icon: XCircle },
};

export default function StudentReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/my-reservations')
            .then((response) => setReservations(response.data))
            .catch(() => toast.error('Failed to load your reservations.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="mx-auto max-w-4xl space-y-4">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        My Reservations
                    </h1>
                    <p className="text-sm text-slate-500">
                        Track your reservation status and see when a boarding house assigns you.
                    </p>
                </div>
                <Link to="/find-boarding">
                    <Button variant="outline">
                        <Search className="mr-2 h-4 w-4" />
                        Find Boarding House
                    </Button>
                </Link>
            </div>

            {reservations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-12 text-center">
                        <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
                        <p className="text-slate-600">You have not submitted any reservations yet.</p>
                        <p className="mt-1 text-sm text-slate-400">Reserve a boarding house from the student finder.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {reservations.map((reservation) => {
                        const meta = STATUS_META[reservation.status] || STATUS_META.pending;
                        const StatusIcon = meta.icon;
                        const assignedRoom = reservation.student?.room;

                        return (
                            <Card key={reservation.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <CardTitle className="text-base">
                                                {reservation.boarding_house?.boarding_name || 'Boarding House'}
                                            </CardTitle>
                                            {reservation.boarding_house?.address && (
                                                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {reservation.boarding_house.address}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="outline" className={`gap-1 ${meta.className}`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {meta.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-2">
                                        <div className="rounded-lg border bg-slate-50 p-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reservation Details</p>
                                            <div className="mt-2 space-y-1.5">
                                                <p className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    Submitted: {new Date(reservation.created_at).toLocaleDateString()}
                                                </p>
                                                <p>
                                                    Move-in Date: {reservation.move_in_date ? new Date(reservation.move_in_date).toLocaleDateString() : 'Not set'}
                                                </p>
                                                <p>Year Level: {reservation.year_level || '-'}</p>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border bg-slate-50 p-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assignment Status</p>
                                            <div className="mt-2 space-y-1.5">
                                                <p>Boarding House: {reservation.status === 'approved' ? 'Approved' : 'Waiting for owner approval'}</p>
                                                <p>Room: {assignedRoom?.room_name || 'Not assigned yet'}</p>
                                                <p>
                                                    Status Note: {reservation.status === 'approved'
                                                        ? 'You can now be assigned to a room by the owner.'
                                                        : 'The owner still needs to review this reservation.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {reservation.message && (
                                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
                                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-600">Your Message</p>
                                            <p>{reservation.message}</p>
                                        </div>
                                    )}

                                    {assignedRoom && (
                                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                                            <Home className="h-4 w-4" />
                                            Room assigned: <span className="font-medium">{assignedRoom.room_name}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
