import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Loader2, MessageSquareWarning, Pencil, UserCheck } from 'lucide-react';

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
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [warningComment, setWarningComment] = useState('');
    const [savingWarning, setSavingWarning] = useState(false);

    const fetchStudent = () => {
        api.get(`/students/${id}`).then((r) => setStudent(r.data));
    };

    useEffect(() => {
        fetchStudent();
    }, [id]);

    const handleAddWarning = async (event) => {
        event.preventDefault();
        if (!warningComment.trim()) {
            toast.error('Warning comment is required.');
            return;
        }

        setSavingWarning(true);
        try {
            await api.post(`/students/${student.id}/warnings`, { comment: warningComment.trim() });
            setWarningComment('');
            toast.success('Warning added.');
            fetchStudent();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add warning.');
        } finally {
            setSavingWarning(false);
        }
    };

    if (!student) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
        );
    }

    const bh = student.boarding_house;
    const photoUrl = student.user?.profile_photo ? `/storage/${student.user.profile_photo}` : null;
    const warningItems = student.warnings?.length
        ? student.warnings
        : (student.has_warning ? [{
            id: 'legacy-warning',
            comment: student.warning_comment || 'This student account has been marked with a warning.',
            owner: { user: student.warning_marked_by },
            boarding_house_name: student.boarding_house?.boarding_name,
            created_at: student.warning_marked_at,
        }] : []);
    const warningCount = student.warnings_count ?? warningItems.length;
    const canAddWarning = user?.role === 'owner';
    const canViewWarnings = ['admin', 'owner'].includes(user?.role);

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Link to="/students">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    {photoUrl && (
                        <img src={photoUrl} alt={`${student.first_name} ${student.last_name}`} className="h-12 w-12 rounded-full object-cover ring-2 ring-green-200" />
                    )}
                    <h1 className="text-2xl font-bold">{student.first_name} {student.last_name}</h1>
                    <Badge variant="secondary" className="font-mono">{student.student_no}</Badge>
                    {student.boarding_approval_status && (
                        <Badge variant="outline" className="capitalize">{student.boarding_approval_status}</Badge>
                    )}
                    {canViewWarnings && warningCount > 0 && (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                            <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                            {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                        </Badge>
                    )}
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
                        <Field label="Email" value={student.user?.email} />
                        <Field label="Gender" value={student.gender} />
                        <Field label="Contact" value={student.contact_number} />
                        <Field label="Home Address" value={student.address} />
                        <Field label="Course" value={student.course} />
                        <Field label="Year Level" value={student.year_level} />
                        <Field label="Parent / Guardian" value={student.parent_name} />
                        <Field label="Parent Contact" value={student.parent_contact} />
                        <Field label="Account Status" value={student.user?.account_status} />
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
                                <Field label="Approval Status" value={student.boarding_approval_status} />
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

            {(student.boarding_rejection_comment || student.user?.rejection_reason) && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader><CardTitle className="text-base text-red-800">Review Comment</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm text-red-700">
                        {student.boarding_rejection_comment && <p>{student.boarding_rejection_comment}</p>}
                        {student.user?.rejection_reason && <p>{student.user.rejection_reason}</p>}
                    </CardContent>
                </Card>
            )}

            {canViewWarnings && (
            <Card className={warningCount > 0 ? 'border-amber-200' : ''}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                        <span className="flex items-center gap-2">
                            <MessageSquareWarning className="h-4 w-4 text-amber-600" />
                            Warning History
                        </span>
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                            {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {canAddWarning && (
                        <form onSubmit={handleAddWarning} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <Textarea
                                value={warningComment}
                                onChange={(event) => setWarningComment(event.target.value)}
                                placeholder="Add warning comment or reason..."
                                maxLength={1000}
                                className="min-h-24 bg-white"
                            />
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-500">{warningComment.length}/1000</p>
                                <Button type="submit" size="sm" disabled={savingWarning} className="w-full sm:w-auto">
                                    {savingWarning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                                    Add Warning
                                </Button>
                            </div>
                        </form>
                    )}

                    {warningCount === 0 ? (
                        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">No warning comments have been added for this student.</p>
                    ) : (
                        <div className="space-y-3">
                            {warningItems.map((warning) => (
                                <div key={warning.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                                    <p className="text-amber-900">{warning.comment}</p>
                                    <div className="mt-2 flex flex-col gap-1 text-xs text-amber-700 sm:flex-row sm:items-center sm:justify-between">
                                        <span>
                                            Submitted by {warning.owner?.full_name || warning.owner?.user?.name || 'Boarding house owner'}
                                            {warning.boarding_house_name ? ` - ${warning.boarding_house_name}` : ''}
                                        </span>
                                        <span>{warning.created_at ? new Date(warning.created_at).toLocaleString() : '-'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            )}
        </div>
    );
}
