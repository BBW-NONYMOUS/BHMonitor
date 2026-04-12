import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';

export default function StudentsReportPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/reports/students')
            .then((r) => setStudents(r.data))
            .finally(() => setLoading(false));
    }, []);

    const filtered = students.filter((s) => {
        const q = search.toLowerCase();
        return (
            s.student_no?.toLowerCase().includes(q) ||
            s.first_name?.toLowerCase().includes(q) ||
            s.last_name?.toLowerCase().includes(q) ||
            s.course?.toLowerCase().includes(q) ||
            s.boarding_house?.boarding_name?.toLowerCase().includes(q)
        );
    });

    const assigned = students.filter((s) => s.boarding_house_id).length;
    const unassigned = students.length - assigned;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Students Report</h1>
                    <p className="text-sm text-slate-500">Complete list of all student records.</p>
                </div>
                <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />Print / Export
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{students.length}</p><p className="mt-1 text-xs text-slate-500">Total Students</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{assigned}</p><p className="mt-1 text-xs text-slate-500">Assigned</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-500">{unassigned}</p><p className="mt-1 text-xs text-slate-500">Unassigned</p></CardContent></Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search students..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Gender</TableHead>
                                    <TableHead>Course / Year</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Boarding House</TableHead>
                                    <TableHead>Owner</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-slate-400">No students found.</TableCell>
                                    </TableRow>
                                ) : filtered.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-mono text-xs">{s.student_no}</TableCell>
                                        <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                                        <TableCell>{s.gender ? <Badge variant="secondary">{s.gender}</Badge> : '-'}</TableCell>
                                        <TableCell className="text-sm">{s.course || '-'}{s.year_level && ` - ${s.year_level}`}</TableCell>
                                        <TableCell className="text-sm">{s.contact_number || '-'}</TableCell>
                                        <TableCell>
                                            {s.boarding_house ? <span className="text-sm">{s.boarding_house.boarding_name}</span> : <Badge variant="secondary">Unassigned</Badge>}
                                        </TableCell>
                                        <TableCell className="text-sm">{s.boarding_house?.owner?.full_name || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
