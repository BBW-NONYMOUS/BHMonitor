import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, CheckCircle, Clock, Eye, Search, ShieldCheck, Trash2, XCircle } from 'lucide-react';

const STATUS_BADGE = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
    declined: { label: 'Declined', cls: 'bg-red-50 text-red-700 border-red-200' },
};

function StatusPill({ status }) {
    const badge = STATUS_BADGE[status] ?? STATUS_BADGE.pending;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
            {status === 'pending' && <Clock className="h-3 w-3" />}
            {status === 'approved' && <CheckCircle className="h-3 w-3" />}
            {(status === 'rejected' || status === 'declined') && <XCircle className="h-3 w-3" />}
            {badge.label}
        </span>
    );
}

export default function AccountApprovalsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [markWarning, setMarkWarning] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/accounts', {
                params: {
                    status: statusFilter || undefined,
                    role: roleFilter || undefined,
                    search: search || undefined,
                    page,
                },
            });
            setAccounts(data.data || []);
            setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [statusFilter, roleFilter, search, page]);

    const handleApprove = async (account) => {
        try {
            await api.put(`/accounts/${account.id}/approve`);
            toast.success(`${account.name} approved.`);
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve account.');
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        setRejecting(true);
        try {
            await api.put(`/accounts/${rejectTarget.id}/reject`, { rejection_reason: rejectReason, mark_warning: markWarning });
            toast.success(`${rejectTarget.name} rejected.`);
            setRejectTarget(null);
            setRejectReason('');
            setMarkWarning(false);
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject account.');
        } finally {
            setRejecting(false);
        }
    };

    const handleDelete = async (account) => {
        try {
            await api.delete(`/accounts/${account.id}`);
            toast.success(`Account for ${account.name} deleted.`);
            fetchAccounts();
        } catch {
            toast.error('Failed to delete account.');
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold">
                    <ShieldCheck className="h-6 w-6 text-blue-600" /> Account Approvals
                </h1>
                <p className="text-sm text-slate-500">
                    {user?.role === 'owner'
                        ? 'Approve or reject students registered to your boarding house.'
                        : 'Approve or reject student and boarding house owner registrations.'}
                </p>
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
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value) => {
                            setStatusFilter(value === 'all' ? '' : value);
                            setPage(1);
                        }}>
                            <SelectTrigger className="w-full md:w-36">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                {user?.role === 'owner' ? (
                                    <SelectItem value="declined">Declined</SelectItem>
                                ) : (
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {user?.role === 'admin' && (
                            <Select value={roleFilter} onValueChange={(value) => {
                                setRoleFilter(value === 'all' ? '' : value);
                                setPage(1);
                            }}>
                                <SelectTrigger className="w-full md:w-36">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="owner">BH Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
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
                                    <TableHead>Boarding House</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-10 text-center text-slate-400">
                                            No accounts found.
                                        </TableCell>
                                    </TableRow>
                                ) : accounts.map((account) => {
                                    const reviewStatus = user?.role === 'owner'
                                        ? account.boarding_approval_status
                                        : account.account_status;
                                    return (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium">{account.name}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{account.email}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${account.role === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                                    {account.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {account.student_no || account.owner_name || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {account.boarding_house || '-'}
                                                {account.boarding_rejection_comment && (
                                                    <p className="mt-0.5 max-w-44 truncate text-xs text-red-500" title={account.boarding_rejection_comment}>
                                                        {account.boarding_rejection_comment}
                                                    </p>
                                                )}
                                                {(account.warnings_count > 0 || account.has_warning) && (
                                                    <p className="mt-0.5 inline-flex max-w-44 items-center gap-1 truncate text-xs font-medium text-amber-600" title={account.warning_comment || 'Warning on profile'}>
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {account.warnings_count || 1} {(account.warnings_count || 1) === 1 ? 'Warning' : 'Warnings'}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">{account.created_at}</TableCell>
                                            <TableCell>
                                                <StatusPill status={reviewStatus} />
                                                {account.rejection_reason && user?.role === 'admin' && (
                                                    <p className="mt-0.5 max-w-40 truncate text-xs text-slate-400" title={account.rejection_reason}>
                                                        {account.rejection_reason}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {account.student_id && (
                                                        <Link to={`/students/${account.student_id}`}>
                                                            <Button size="icon" variant="ghost" title="View profile">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {reviewStatus !== 'approved' && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-green-600 hover:bg-green-50"
                                                            title="Approve"
                                                            onClick={() => handleApprove(account)}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {!['rejected', 'declined'].includes(reviewStatus) && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-red-500 hover:bg-red-50"
                                                            title="Reject"
                                                            onClick={() => {
                                                                setRejectTarget(account);
                                                                setRejectReason('');
                                                                setMarkWarning(false);
                                                            }}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {user?.role === 'admin' && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete account">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will permanently delete <strong>{account.name}</strong>'s account and cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(account)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
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
                            <p className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page} - {meta.total} total</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</Button>
                                <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((current) => current + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => {
                if (!open) {
                    setRejectTarget(null);
                    setMarkWarning(false);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Account - {rejectTarget?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-slate-500">
                            Add a comment explaining the rejection. The student and future reviewers can see this note.
                        </p>
                        <Input
                            placeholder="Reason or warning comment"
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                        />
                        {user?.role === 'owner' && (
                            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                <input
                                    type="checkbox"
                                    checked={markWarning}
                                    onChange={(event) => setMarkWarning(event.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-amber-300"
                                />
                                <span>
                                    <span className="block font-medium">Mark student account with a warning</span>
                                    <span className="text-xs text-amber-700">Use this when the rejection reason should be visible during future reviews.</span>
                                </span>
                            </label>
                        )}
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
