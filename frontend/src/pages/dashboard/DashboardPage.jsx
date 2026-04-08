import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DonutChart } from '@/components/ui/chart-pie';
import { BarChart } from '@/components/ui/chart-bar';
import { Empty } from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OwnerOnboarding } from '@/components/ui/owner-onboarding';
import { Users, Building2, BedDouble, CheckSquare, Clock, TrendingUp, UserPlus, Home, MapPin, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { isOwner, isNewOwner } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [boardingHouses, setBoardingHouses] = useState([]);
    const [showOnboarding, setShowOnboarding] = useState(true);

    useEffect(() => {
        api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
        
        // Fetch boarding houses for owners to check onboarding status
        if (isOwner()) {
            api.get('/boarding-houses').then(r => setBoardingHouses(r.data?.data || [])).catch(() => {});
        }
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const { stats, recent_logs } = data ?? {};

    // Prepare chart data
    const occupancyData = stats ? [
        { name: 'Occupied', value: stats.occupied_rooms || 0 },
        { name: 'Available', value: (stats.total_rooms || 0) - (stats.occupied_rooms || 0) },
    ] : [];

    const occupancyPercent = stats?.total_rooms 
        ? Math.round((stats.occupied_rooms / stats.total_rooms) * 100) 
        : 0;

    // Quick action items with icons
    const quickActions = [
        { to: '/students/create', label: 'Add Student', icon: UserPlus, color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200' },
        { to: '/boarding-houses/create', label: 'Add Boarding', icon: Plus, color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' },
        { to: '/boarding-houses/map', label: 'View Map', icon: MapPin, color: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200' },
        { to: '/find-boarding', label: 'Find Boarding', icon: Search, color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200' },
    ];

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                {/* Owner Onboarding - Show for new owners or owners without complete setup */}
                {isOwner() && showOnboarding && (isNewOwner || boardingHouses.length === 0 || 
                    !boardingHouses.some(bh => bh.latitude && bh.longitude) || 
                    !boardingHouses.some(bh => (bh.total_rooms || 0) > 0)) && (
                    <OwnerOnboarding 
                        boardingHouses={boardingHouses} 
                        onDismiss={() => setShowOnboarding(false)} 
                    />
                )}

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Overview of the boarding monitoring system.</p>
                </div>

                {/* Stats with animated counters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard 
                        title="Total Students" 
                        value={stats?.total_students || 0} 
                        icon={Users} 
                        iconClassName="bg-blue-100 text-blue-600"
                    />
                    <StatCard 
                        title="Boarding Houses" 
                        value={stats?.total_boarding_houses || 0} 
                        icon={Building2} 
                        iconClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard 
                        title="Total Rooms" 
                        value={stats?.total_rooms || 0} 
                        icon={BedDouble} 
                        iconClassName="bg-violet-100 text-violet-600"
                    />
                    <StatCard 
                        title="Occupied Rooms" 
                        value={stats?.occupied_rooms || 0} 
                        icon={CheckSquare} 
                        iconClassName="bg-orange-100 text-orange-600"
                        description={`${occupancyPercent}% occupancy`}
                    />
                </div>

                {/* Charts & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Occupancy Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUp className="size-4 text-slate-500" />
                                Room Occupancy Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="chart" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="chart">Chart View</TabsTrigger>
                                    <TabsTrigger value="progress">Progress View</TabsTrigger>
                                </TabsList>
                                <TabsContent value="chart">
                                    {occupancyData.length > 0 ? (
                                        <DonutChart 
                                            data={occupancyData} 
                                            className="h-[250px]" 
                                            colors={['#1459c7', '#e2e8f0']}
                                        />
                                    ) : (
                                        <Empty variant="default" title="No room data" description="Add rooms to see occupancy." />
                                    )}
                                </TabsContent>
                                <TabsContent value="progress">
                                    <div className="flex flex-col gap-4 py-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">Overall Occupancy</span>
                                                <span className="text-slate-500">{occupancyPercent}%</span>
                                            </div>
                                            <Progress 
                                                value={occupancyPercent} 
                                                indicatorClassName={
                                                    occupancyPercent >= 90 ? 'bg-red-500' : 
                                                    occupancyPercent >= 70 ? 'bg-amber-500' : 
                                                    'bg-emerald-500'
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="rounded-lg bg-blue-50 p-4 text-center">
                                                <p className="text-2xl font-bold text-blue-700">{stats?.occupied_rooms || 0}</p>
                                                <p className="text-sm text-blue-600">Occupied</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-100 p-4 text-center">
                                                <p className="text-2xl font-bold text-slate-700">
                                                    {(stats?.total_rooms || 0) - (stats?.occupied_rooms || 0)}
                                                </p>
                                                <p className="text-sm text-slate-600">Available</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                {quickActions.map(action => (
                                    <Tooltip key={action.to}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                to={action.to}
                                                className={`flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all hover:scale-[1.02] ${action.color}`}
                                            >
                                                <action.icon className="size-5" />
                                                {action.label}
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{action.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="size-4 text-slate-500" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!recent_logs?.length ? (
                            <Empty 
                                variant="default" 
                                title="No recent activity" 
                                description="Activity will appear here as you use the system."
                            />
                        ) : (
                            <ScrollArea className="h-[250px] pr-4">
                                <ul className="flex flex-col gap-1">
                                    {recent_logs.map((log, index) => (
                                        <li 
                                            key={log.id} 
                                            className="flex items-start justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50"
                                            style={{ 
                                                animationDelay: `${index * 50}ms`,
                                                animation: 'fade-in 0.3s ease-out forwards'
                                            }}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5 size-2 rounded-full bg-blue-500" />
                                                <div>
                                                    <p className="text-sm text-slate-800">{log.action}</p>
                                                    {log.user && <p className="text-xs text-slate-400">by {log.user}</p>}
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-xs text-slate-400">{log.created_at}</span>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
