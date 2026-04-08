import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
    MessageCircle, Mail, Phone, Clock, Building2,
    CheckCircle, XCircle, AlertCircle, Filter, RefreshCw, ExternalLink
} from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', variant: 'warning', icon: Clock },
    contacted: { label: 'Contacted', variant: 'info', icon: MessageCircle },
    approved: { label: 'Approved', variant: 'success', icon: CheckCircle },
    declined: { label: 'Declined', variant: 'destructive', icon: XCircle },
    cancelled: { label: 'Cancelled', variant: 'secondary', icon: AlertCircle },
};

export default function AllInquiriesPage() {
    const navigate = useNavigate();
    const { fetchNotifications, fetchUnreadCount } = useNotifications();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/student-inquiries');
            setInquiries(data);
        } catch (err) {
            console.error('Failed to fetch inquiries', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (inquiryId, newStatus) => {
        setUpdating(inquiryId);
        try {
            await api.put(`/student-inquiries/${inquiryId}`, { status: newStatus });
            setInquiries(prev => prev.map(inq => 
                inq.id === inquiryId ? { ...inq, status: newStatus } : inq
            ));
            // Refresh notifications when inquiry status changes
            fetchUnreadCount();
        } catch (err) {
            console.error('Failed to update status', err);
        } finally {
            setUpdating(null);
        }
    };

    const filteredInquiries = filter === 'all' 
        ? inquiries 
        : inquiries.filter(inq => inq.status === filter);

    const counts = {
        all: inquiries.length,
        pending: inquiries.filter(i => i.status === 'pending').length,
        contacted: inquiries.filter(i => i.status === 'contacted').length,
        approved: inquiries.filter(i => i.status === 'approved').length,
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">All Inquiries</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        View and manage all student inquiries across your boarding houses
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchInquiries}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:border-blue-200" onClick={() => setFilter('all')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
                        <p className="text-sm text-slate-500">Total Inquiries</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-yellow-200" onClick={() => setFilter('pending')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
                        <p className="text-sm text-slate-500">Pending</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-blue-200" onClick={() => setFilter('contacted')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-blue-600">{counts.contacted}</p>
                        <p className="text-sm text-slate-500">Contacted</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-green-200" onClick={() => setFilter('approved')}>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
                        <p className="text-sm text-slate-500">Approved</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ({counts.all})</SelectItem>
                        <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
                        <SelectItem value="contacted">Contacted ({counts.contacted})</SelectItem>
                        <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Inquiries List */}
            {filteredInquiries.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 text-slate-400">
                        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p>No inquiries found.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Boarding House</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInquiries.map(inq => {
                                    const StatusIcon = STATUS_CONFIG[inq.status]?.icon || Clock;
                                    return (
                                        <TableRow key={inq.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{inq.full_name}</p>
                                                    {inq.student_no && (
                                                        <p className="text-xs text-slate-400">{inq.student_no}</p>
                                                    )}
                                                    {inq.course && (
                                                        <p className="text-xs text-slate-400">{inq.course} - {inq.year_level}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                    <span 
                                                        className="text-blue-600 hover:underline cursor-pointer"
                                                        onClick={() => navigate(`/boarding-houses/${inq.boarding_house_id}`)}
                                                    >
                                                        {inq.boarding_house?.boarding_name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    <p className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        <a href={`mailto:${inq.email}`} className="text-blue-600 hover:underline">
                                                            {inq.email}
                                                        </a>
                                                    </p>
                                                    <p className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-slate-400" />
                                                        <a href={`tel:${inq.contact_number}`} className="text-blue-600 hover:underline">
                                                            {inq.contact_number}
                                                        </a>
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm space-y-1">
                                                    {inq.gender && <Badge variant="outline">{inq.gender}</Badge>}
                                                    {inq.budget > 0 && (
                                                        <p className="text-xs text-slate-500">Budget: ₱{Number(inq.budget).toLocaleString()}</p>
                                                    )}
                                                    {inq.move_in_date && (
                                                        <p className="text-xs text-slate-500">Move-in: {new Date(inq.move_in_date).toLocaleDateString()}</p>
                                                    )}
                                                    {inq.message && (
                                                        <p className="text-xs text-slate-400 truncate max-w-[150px]" title={inq.message}>
                                                            "{inq.message}"
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_CONFIG[inq.status]?.variant || 'secondary'} className="gap-1">
                                                    <StatusIcon className="h-3 w-3" />
                                                    {STATUS_CONFIG[inq.status]?.label || inq.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(inq.created_at).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(inq.created_at).toLocaleTimeString()}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    value={inq.status} 
                                                    onValueChange={(v) => updateStatus(inq.id, v)}
                                                    disabled={updating === inq.id}
                                                >
                                                    <SelectTrigger className="w-32 h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="contacted">Contacted</SelectItem>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="declined">Declined</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
