import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, UserCheck } from 'lucide-react';

function Field({ label, value }) {
    return (
        <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm text-slate-900 mt-0.5">{value || '—'}</p>
        </div>
    );
}

export default function StudentViewPage() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {
        api.get(`/students/${id}`).then(r => setStudent(r.data));
    }, [id]);

    if (!student) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );

    const bh = student.boarding_house;

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/students">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{student.first_name} {student.last_name}</h1>
                    <Badge variant="secondary" className="font-mono">{student.student_no}</Badge>
                </div>
                <div className="flex gap-2">
                    <Link to={`/students/${id}/assign`}>
                        <Button variant="outline" size="sm"><UserCheck className="h-4 w-4 mr-2" />Assign</Button>
                    </Link>
                    <Link to={`/students/${id}/edit`}>
                        <Button size="sm"><Pencil className="h-4 w-4 mr-2" />Edit</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Field label="Gender" value={student.gender} />
                        <Field label="Contact" value={student.contact_number} />
                        <Field label="Course" value={student.course} />
                        <Field label="Year Level" value={student.year_level} />
                        <Field label="Parent / Guardian" value={student.parent_name} />
                        <Field label="Parent Contact" value={student.parent_contact} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Boarding Assignment</CardTitle></CardHeader>
                    <CardContent>
                        {bh ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="success">Assigned</Badge>
                                </div>
                                <Field label="Boarding House" value={bh.boarding_name} />
                                <Field label="Address" value={bh.address} />
                                <Field label="Owner" value={bh.owner?.full_name} />
                                <Field label="Room Rate" value={bh.room_rate ? `₱${Number(bh.room_rate).toLocaleString()}/mo` : null} />
                                <Link to={`/boarding-houses/${bh.id}`}>
                                    <Button variant="outline" size="sm" className="mt-2">View Boarding House</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Badge variant="secondary">Not Assigned</Badge>
                                <p className="text-sm text-slate-400 mt-2">No boarding house assigned.</p>
                                <Link to={`/students/${id}/assign`}>
                                    <Button size="sm" className="mt-3">Assign Now</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
