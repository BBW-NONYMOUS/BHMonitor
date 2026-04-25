import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Empty } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Search, Loader2 } from 'lucide-react';

export default function StudentApprovalsPage() {
  const { isOwner } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [declineModal, setDeclineModal] = useState({ open: false, studentId: null, reason: '' });

  useEffect(() => {
    if (!isOwner()) {
      navigate('/dashboard');
      return;
    }

    fetchPendingStudents();
  }, [isOwner, navigate]);

  const fetchPendingStudents = () => {
    setLoading(true);
    api
      .get('/pending-approvals')
      .then(({ data }) => {
        setStudents(data?.data || []);
      })
      .catch(() => {
        toast.error('Failed to load pending approvals');
      })
      .finally(() => setLoading(false));
  };

  const handleApprove = async (studentId) => {
    setProcessingId(studentId);
    try {
      await api.post(`/students/${studentId}/approve-boarding`);
      toast.success('Student approved successfully!');
      setStudents(students.filter(s => s.id !== studentId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve student');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineClick = (studentId) => {
    setDeclineModal({ open: true, studentId, reason: '' });
  };

  const handleDeclineConfirm = async () => {
    const { studentId, reason } = declineModal;
    setProcessingId(studentId);
    try {
      await api.post(`/students/${studentId}/decline-boarding`, {
        rejection_comment: reason,
      });
      toast.success('Student application declined');
      setStudents(students.filter(s => s.id !== studentId));
      setDeclineModal({ open: false, studentId: null, reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline student');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter(
    s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.student_no.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = filteredStudents.length;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Approvals</h1>
            <p className="text-slate-500 text-sm mt-1">Review and manage pending student registrations</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Approvals</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{students.length}</p>
              </div>
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Students</CardTitle>
          <CardDescription>Review applications from students who registered with your boarding house</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <Empty
              title="No pending approvals"
              description={search ? 'No students match your search' : 'All pending approvals have been processed'}
              icon={CheckCircle2}
            />
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {student.user?.profile_photo ? (
                          <img
                            src={student.user.profile_photo}
                            alt={student.first_name}
                            className="h-12 w-12 rounded-full object-cover bg-slate-100"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-600">
                            {student.first_name[0]}
                            {student.last_name[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            ID: {student.student_no} • {student.course || 'N/A'} • {student.year_level || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{student.user?.email}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500">Gender</p>
                          <p className="font-medium text-slate-900">{student.gender || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Contact</p>
                          <p className="font-medium text-slate-900">{student.contact_number || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(student.id)}
                        disabled={processingId === student.id}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        {processingId === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeclineClick(student.id)}
                        disabled={processingId === student.id}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>

                  {student.address && (
                    <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-medium">Address:</span> {student.address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decline Modal */}
      <AlertDialog open={declineModal.open} onOpenChange={(open) =>
        setDeclineModal({ ...declineModal, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This student's application will be marked as declined. You can optionally add a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <Textarea
              placeholder="Optional: Explain why you're declining this application..."
              value={declineModal.reason}
              onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
              className="h-24"
              maxLength={500}
            />
            <p className="text-xs text-slate-500">{declineModal.reason.length}/500</p>
          </div>

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeclineConfirm}
              disabled={processingId === declineModal.studentId}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingId === declineModal.studentId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Declining...
                </>
              ) : (
                'Decline'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
