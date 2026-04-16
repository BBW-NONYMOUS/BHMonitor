import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Pencil, BedDouble, MapPin, MessageCircle } from 'lucide-react';

function Field({ label, value }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-0.5 break-words text-sm text-slate-900">{value || '-'}</p>
        </div>
    );
}

export default function BoardingHouseViewPage() {
    const { id } = useParams();
    const [bh, setBh] = useState(null);

    useEffect(() => {
        api.get(`/boarding-houses/${id}`).then((r) => setBh(r.data));
    }, [id]);

    if (!bh) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Link to="/boarding-houses">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{bh.boarding_name}</h1>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />{bh.address}
                        </p>
                    </div>
                    <Badge variant={bh.status === 'active' ? 'success' : 'secondary'}>{bh.status ?? 'active'}</Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Link to={`/boarding-houses/${id}/inquiries`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto"><MessageCircle className="mr-2 h-4 w-4" />Inquiries</Button>
                    </Link>
                    <Link to={`/boarding-houses/${id}/rooms`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto"><BedDouble className="mr-2 h-4 w-4" />Rooms</Button>
                    </Link>
                    <Link to={`/boarding-houses/${id}/edit`} className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Owner" value={bh.owner?.full_name} />
                        <Field label="Contact" value={bh.owner?.contact_number} />
                        <Field label="Facilities" value={bh.facilities} />
                        <div className="sm:col-span-2">
                            <Field label="Description" value={bh.description} />
                        </div>
                        {bh.latitude && bh.longitude && (
                            <>
                                <Field label="Latitude" value={bh.latitude} />
                                <Field label="Longitude" value={bh.longitude} />
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Rooms Summary</CardTitle></CardHeader>
                    <CardContent>
                        {bh.rooms?.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-400">No rooms added yet.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Room</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Slots</TableHead>
                                        <TableHead>Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bh.rooms?.map((room) => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.room_name}</TableCell>
                                            <TableCell><Badge variant="secondary">{room.gender_type || 'Mixed'}</Badge></TableCell>
                                            <TableCell className="text-sm">{room.available_slots}/{room.capacity}</TableCell>
                                            <TableCell className="text-sm">P{Number(room.price).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {bh.students?.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Residents ({bh.students.length})</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Gender</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bh.students.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-mono text-xs">{s.student_no}</TableCell>
                                        <TableCell>
                                            <Link to={`/students/${s.id}`} className="font-medium text-blue-600 hover:underline">
                                                {s.first_name} {s.last_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm">{s.course || '-'}</TableCell>
                                        <TableCell>{s.gender && <Badge variant="secondary">{s.gender}</Badge>}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
