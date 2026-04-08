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
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm text-slate-900 mt-0.5">{value || '—'}</p>
        </div>
    );
}

export default function BoardingHouseViewPage() {
    const { id } = useParams();
    const [bh, setBh] = useState(null);

    useEffect(() => {
        api.get(`/boarding-houses/${id}`).then(r => setBh(r.data));
    }, [id]);

    if (!bh) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/boarding-houses">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{bh.boarding_name}</h1>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />{bh.address}
                        </p>
                    </div>
                    <Badge variant={bh.status === 'active' ? 'success' : 'secondary'}>{bh.status ?? 'active'}</Badge>
                </div>
                <div className="flex gap-2">
                    <Link to={`/boarding-houses/${id}/inquiries`}>
                        <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4 mr-2" />Inquiries</Button>
                    </Link>
                    <Link to={`/boarding-houses/${id}/rooms`}>
                        <Button variant="outline" size="sm"><BedDouble className="h-4 w-4 mr-2" />Rooms</Button>
                    </Link>
                    <Link to={`/boarding-houses/${id}/edit`}>
                        <Button size="sm"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    
                    <CardHeader>
                        <CardTitle className="text-base">Details</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Field label="Owner" value={bh.owner?.full_name} />
                        <Field label="Contact" value={bh.owner?.contact_number} />
                        <Field label="Facilities" value={bh.facilities} />
                        <div className="col-span-2">
                            <Field label="Description" value={bh.description} />
                        </div>
                    
                        {(bh.latitude && bh.longitude) && (
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
                            <div className="text-center py-6 text-slate-400 text-sm">No rooms added yet.</div>
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
                                    {bh.rooms?.map(room => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.room_name}</TableCell>
                                            <TableCell><Badge variant="secondary">{room.gender_type || 'Mixed'}</Badge></TableCell>
                                            <TableCell className="text-sm">{room.available_slots}/{room.capacity}</TableCell>
                                            <TableCell className="text-sm">₱{Number(room.price).toLocaleString()}</TableCell>
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
                                    <TableHead>Student No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Gender</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bh.students.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-mono text-xs">{s.student_no}</TableCell>
                                        <TableCell>
                                            <Link to={`/students/${s.id}`} className="text-blue-600 hover:underline font-medium">
                                                {s.first_name} {s.last_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm">{s.course || '—'}</TableCell>
                                        <TableCell>
                                            {s.gender && <Badge variant="secondary">{s.gender}</Badge>}
                                        </TableCell>
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
