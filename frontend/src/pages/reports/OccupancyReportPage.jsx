import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DonutChart } from '@/components/ui/chart-pie';
import { BarChart } from '@/components/ui/chart-bar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Building2, Users, BedDouble, TrendingUp, Info } from 'lucide-react';

function OccupancyBar({ used, total }) {
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-full">
                        <Progress
                            value={pct}
                            indicatorClassName={
                                pct >= 90 ? 'bg-red-500' :
                                pct >= 60 ? 'bg-amber-500' :
                                'bg-emerald-500'
                            }
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{used}/{total} slots ({pct}%)</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function ReportSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-80 rounded-lg" />
            {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
        </div>
    );
}

export default function OccupancyReportPage() {
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reports/occupancy')
            .then((r) => setHouses(r.data))
            .finally(() => setLoading(false));
    }, []);

    const totals = houses.reduce((acc, bh) => {
        const cap = bh.rooms?.reduce((s, r) => s + (r.capacity || 0), 0) ?? 0;
        const occ = bh.rooms?.reduce((s, r) => s + (r.occupied_slots || 0), 0) ?? 0;
        return { capacity: acc.capacity + cap, occupied: acc.occupied + occ };
    }, { capacity: 0, occupied: 0 });

    const occupancyPieData = [
        { name: 'Occupied', value: totals.occupied },
        { name: 'Available', value: totals.capacity - totals.occupied },
    ];

    const houseBarData = houses.map((bh) => ({
        name: bh.boarding_name?.length > 15 ? `${bh.boarding_name.slice(0, 15)}...` : bh.boarding_name,
        occupancy: bh.rooms?.reduce((s, r) => s + (r.occupied_slots || 0), 0) ?? 0,
        capacity: bh.rooms?.reduce((s, r) => s + (r.capacity || 0), 0) ?? 0,
    }));

    const overallOccupancy = totals.capacity > 0
        ? Math.round((totals.occupied / totals.capacity) * 100)
        : 0;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Occupancy Report</h1>
                        <p className="text-sm text-slate-500">Room-level occupancy across all boarding houses.</p>
                    </div>
                    <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
                        <Download className="size-4" />
                        Print / Export
                    </Button>
                </div>

                {loading ? (
                    <ReportSkeleton />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <StatCard title="Total Capacity" value={totals.capacity} icon={BedDouble} iconClassName="bg-slate-100 text-slate-600" />
                            <StatCard title="Occupied Slots" value={totals.occupied} icon={Users} iconClassName="bg-blue-100 text-blue-600" description={`${overallOccupancy}% overall`} />
                            <StatCard title="Available Slots" value={totals.capacity - totals.occupied} icon={Building2} iconClassName="bg-emerald-100 text-emerald-600" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <TrendingUp className="size-4 text-slate-500" />
                                        Overall Occupancy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DonutChart data={occupancyPieData} className="h-[250px]" colors={['#1459c7', '#e2e8f0']} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Building2 className="size-4 text-slate-500" />
                                        Occupancy by Boarding House
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {houseBarData.length > 0 ? (
                                        <BarChart data={houseBarData} dataKey="occupancy" className="h-[250px]" />
                                    ) : (
                                        <div className="flex h-[250px] items-center justify-center text-slate-400">
                                            No boarding house data
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Info className="size-4 text-slate-500" />
                                    Detailed Room Occupancy
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {houses.map((bh) => {
                                        const cap = bh.rooms?.reduce((s, r) => s + (r.capacity || 0), 0) ?? 0;
                                        const occ = bh.rooms?.reduce((s, r) => s + (r.occupied_slots || 0), 0) ?? 0;
                                        const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;

                                        return (
                                            <AccordionItem key={bh.id} value={`bh-${bh.id}`}>
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex flex-1 flex-col items-start gap-3 pr-4 sm:flex-row sm:items-center sm:justify-between">
                                                        <span className="font-medium">{bh.boarding_name}</span>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <Badge variant={pct >= 90 ? 'destructive' : pct >= 60 ? 'warning' : 'success'}>
                                                                {pct}% occupied
                                                            </Badge>
                                                            <span className="text-sm text-slate-500">{occ}/{cap} slots</span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    {bh.rooms?.length > 0 ? (
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Room</TableHead>
                                                                    <TableHead>Type</TableHead>
                                                                    <TableHead>Capacity</TableHead>
                                                                    <TableHead>Occupied</TableHead>
                                                                    <TableHead>Available</TableHead>
                                                                    <TableHead>Price</TableHead>
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead className="w-32">Occupancy</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {bh.rooms.map((room) => (
                                                                    <TableRow key={room.id}>
                                                                        <TableCell className="font-medium">{room.room_name}</TableCell>
                                                                        <TableCell><Badge variant="secondary">{room.gender_type || 'Mixed'}</Badge></TableCell>
                                                                        <TableCell>{room.capacity}</TableCell>
                                                                        <TableCell>{room.occupied_slots ?? 0}</TableCell>
                                                                        <TableCell>{room.available_slots ?? room.capacity}</TableCell>
                                                                        <TableCell>P{Number(room.price).toLocaleString()}</TableCell>
                                                                        <TableCell>
                                                                            <Badge variant={room.status === 'available' ? 'success' : room.status === 'maintenance' ? 'secondary' : 'default'}>
                                                                                {room.status || 'available'}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell><OccupancyBar used={room.occupied_slots ?? 0} total={room.capacity} /></TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    ) : (
                                                        <p className="py-4 text-center text-sm text-slate-400">No rooms in this boarding house.</p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}
