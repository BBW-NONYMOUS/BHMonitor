import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Search, Eye, Pencil, Trash2, UserCheck } from 'lucide-react';

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/students', { params: { search, page } });
            setStudents(data.data);
            setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [search, page]);

    const handleDelete = async (id, name) => {
        try {
            await api.delete(`/students/${id}`);
            toast.success(`${name} deleted.`);
            fetchStudents();
        } catch {
            toast.error('Failed to delete student.');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Students</h1>
                    <p className="text-sm text-slate-500">Manage student records and boarding assignments.</p>
                </div>
                <Link to="/students/create" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add Student</Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by name or student no..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
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
                                    <TableHead>Course / Year</TableHead>
                                    <TableHead>Boarding House</TableHead>
                                    <TableHead>Gender</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-10 text-center text-slate-400">No students found.</TableCell>
                                    </TableRow>
                                ) : students.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-mono text-xs">{student.student_no}</TableCell>
                                        <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                                        <TableCell>
                                            <span className="text-sm">{student.course || '-'}</span>
                                            {student.year_level && <span className="ml-1 text-xs text-slate-400">- {student.year_level}</span>}
                                        </TableCell>
                                        <TableCell>
                                            {student.boarding_house ? (
                                                <span className="text-sm">{student.boarding_house.boarding_name}</span>
                                            ) : (
                                                <Badge variant="secondary">Unassigned</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {student.gender && (
                                                <Badge variant={student.gender === 'Male' ? 'default' : 'secondary'}>
                                                    {student.gender}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link to={`/students/${student.id}`}>
                                                    <Button size="icon" variant="ghost" title="View"><Eye className="h-4 w-4" /></Button>
                                                </Link>
                                                <Link to={`/students/${student.id}/edit`}>
                                                    <Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                </Link>
                                                <Link to={`/students/${student.id}/assign`}>
                                                    <Button size="icon" variant="ghost" title="Assign"><UserCheck className="h-4 w-4" /></Button>
                                                </Link>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-700">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete <strong>{student.first_name} {student.last_name}</strong>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(student.id, `${student.first_name} ${student.last_name}`)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {meta.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Page {meta.current_page} of {meta.last_page} - {meta.total} total
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
