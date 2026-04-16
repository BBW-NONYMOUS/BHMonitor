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
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-0.5 break-words text-sm text-slate-900">{value || '-'}</p>
        </div>
    );
}

export default function StudentViewPage() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {
        api.get(`/students/${id}`).then((r) => setStudent(r.data));
    }, [id]);

    if (!student) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
        );
    }

    const bh = student.boarding_house;

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Link to="/students">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{student.first_name} {student.last_name}</h1>
                    <Badge variant="secondary" className="font-mono">{student.student_no}</Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Link to={`/students/${id}/assign`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto"><UserCheck className="mr-2 h-4 w-4" />Assign</Button>
                    </Link>
                    <Link to={`/students/${id}/edit`} className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                <Field label="Room Rate" value={bh.room_rate ? `P${Number(bh.room_rate).toLocaleString()}/mo` : null} />
                                <Link to={`/boarding-houses/${bh.id}`} className="inline-flex w-full sm:w-auto">
                                    <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto">View Boarding House</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="py-6 text-center">
                                <Badge variant="secondary">Not Assigned</Badge>
                                <p className="mt-2 text-sm text-slate-400">No boarding house assigned.</p>
                                <Link to={`/students/${id}/assign`} className="inline-flex w-full justify-center sm:w-auto">
                                    <Button size="sm" className="mt-3 w-full sm:w-auto">Assign Now</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
