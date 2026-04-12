import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';

export default function BoardingReportPage() {
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/reports/boarding-houses')
            .then((r) => setHouses(r.data))
            .finally(() => setLoading(false));
    }, []);

    const filtered = houses.filter((bh) => {
        const q = search.toLowerCase();
        return (
            bh.boarding_name?.toLowerCase().includes(q) ||
            bh.address?.toLowerCase().includes(q) ||
            bh.owner?.full_name?.toLowerCase().includes(q)
        );
    });

    const active = houses.filter((bh) => bh.status === 'active').length;
    const totalStudents = houses.reduce((sum, bh) => sum + (bh.students_count ?? 0), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Boarding Houses Report</h1>
                    <p className="text-sm text-slate-500">Summary of all boarding house listings.</p>
                </div>
                <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />Print / Export
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{houses.length}</p><p className="mt-1 text-xs text-slate-500">Total Houses</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{active}</p><p className="mt-1 text-xs text-slate-500">Active</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{totalStudents}</p><p className="mt-1 text-xs text-slate-500">Total Residents</p></CardContent></Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search boarding houses..."
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
                                    <TableHead>Boarding House</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Rooms</TableHead>
                                    <TableHead className="text-right">Residents</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-10 text-center text-slate-400">No boarding houses found.</TableCell>
                                    </TableRow>
                                ) : filtered.map((bh) => (
                                    <TableRow key={bh.id}>
                                        <TableCell className="font-medium">{bh.boarding_name}</TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-slate-500">{bh.address}</TableCell>
                                        <TableCell className="text-sm">{bh.owner?.full_name || '-'}</TableCell>
                                        <TableCell><Badge variant={bh.status === 'active' ? 'success' : 'secondary'}>{bh.status ?? 'active'}</Badge></TableCell>
                                        <TableCell className="text-right">{bh.rooms_count ?? 0}</TableCell>
                                        <TableCell className="text-right">{bh.students_count ?? 0}</TableCell>
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
