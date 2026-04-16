import { useEffect, useState } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Trash2, Search, Clock, ShieldCheck } from 'lucide-react';

const STATUS_BADGE = {
    pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function AccountApprovalsPage() {
    const [accounts, setAccounts] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    // Reject dialog
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/accounts', {
                params: { status: statusFilter || undefined, role: roleFilter || undefined, search: search || undefined, page }
            });
            setAccounts(data.data);
            setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAccounts(); }, [statusFilter, roleFilter, search, page]);

    const handleApprove = async (user) => {
        try {
            await api.put(`/accounts/${user.id}/approve`);
            toast.success(`${user.name} approved.`);
            fetchAccounts();
        } catch { toast.error('Failed to approve account.'); }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        setRejecting(true);
        try {
            await api.put(`/accounts/${rejectTarget.id}/reject`, { rejection_reason: rejectReason });
            toast.success(`${rejectTarget.name} rejected.`);
            setRejectTarget(null);
            setRejectReason('');
            fetchAccounts();
        } catch { toast.error('Failed to reject account.'); }
        finally { setRejecting(false); }
    };

    const handleDelete = async (user) => {
        try {
            await api.delete(`/accounts/${user.id}`);
            toast.success(`Account for ${user.name} deleted.`);
            fetchAccounts();
        } catch { toast.error('Failed to delete account.'); }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-blue-600" /> Account Approvals
                </h1>
                <p className="text-sm text-slate-500">Approve or reject student and boarding house owner registrations.</p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-9"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-full md:w-36">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-full md:w-36">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="owner">BH Owner</SelectItem>
                            </SelectContent>
                        </Select>
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Student ID / Owner</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-slate-400">
                                            No accounts found.
                                        </TableCell>
                                    </TableRow>
                                ) : accounts.map(acc => {
                                    const badge = STATUS_BADGE[acc.account_status] ?? STATUS_BADGE.pending;
                                    return (
                                        <TableRow key={acc.id}>
                                            <TableCell className="font-medium">{acc.name}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{acc.email}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${acc.role === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                                    {acc.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {acc.student_no || acc.owner_name || '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">{acc.created_at}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                                                    {acc.account_status === 'pending'  && <Clock className="h-3 w-3" />}
                                                    {acc.account_status === 'approved' && <CheckCircle className="h-3 w-3" />}
                                                    {acc.account_status === 'rejected' && <XCircle className="h-3 w-3" />}
                                                    {badge.label}
                                                </span>
                                                {acc.rejection_reason && (
                                                    <p className="text-xs text-slate-400 mt-0.5 max-w-[160px] truncate" title={acc.rejection_reason}>
                                                        {acc.rejection_reason}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {acc.account_status !== 'approved' && (
                                                        <Button
                                                            size="icon" variant="ghost"
                                                            className="text-green-600 hover:bg-green-50"
                                                            title="Approve"
                                                            onClick={() => handleApprove(acc)}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {acc.account_status !== 'rejected' && (
                                                        <Button
                                                            size="icon" variant="ghost"
                                                            className="text-red-500 hover:bg-red-50"
                                                            title="Reject"
                                                            onClick={() => { setRejectTarget(acc); setRejectReason(''); }}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-red-600 hover:bg-red-50" title="Delete account">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete <strong>{acc.name}</strong>'s account and cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(acc)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}

                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <p className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page} — {meta.total} total</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reject with Reason Dialog */}
            <Dialog open={!!rejectTarget} onOpenChange={v => !v && setRejectTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Account — {rejectTarget?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-slate-500">Provide an optional reason. The user will see this message when they try to log in.</p>
                        <div className="space-y-1">
                            <Input
                                placeholder="Reason for rejection (optional)"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
                            {rejecting && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />}
                            Reject Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
