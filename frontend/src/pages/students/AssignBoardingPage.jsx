import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function AssignBoardingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [boardingHouses, setBoardingHouses] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/students/${id}`).then(r => {
            setStudent(r.data);
            setSelected(r.data.boarding_house_id);
        });
        api.get('/boarding-houses?status=active&per_page=100').then(r => setBoardingHouses(r.data.data || []));
    }, [id]);

    const handleAssign = async () => {
        setLoading(true);
        try {
            await api.post(`/students/${id}/assign`, { boarding_house_id: selected || null });
            toast.success('Student assigned successfully.');
            navigate(`/students/${id}`);
        } catch {
            toast.error('Failed to assign student.');
        } finally {
            setLoading(false);
        }
    };

    if (!student) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
                <Link to={`/students/${id}`}>
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-2xl font-bold">Assign Boarding House</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Assigning to: <span className="text-blue-600">{student.first_name} {student.last_name}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {/* Unassign option */}
                        <div
                            onClick={() => setSelected(null)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${!selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">None</span>
                                {!selected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                            </div>
                            <p className="text-xs text-slate-400">Remove assignment</p>
                        </div>

                        {boardingHouses.map(bh => (
                            <div
                                key={bh.id}
                                onClick={() => setSelected(bh.id)}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${selected == bh.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-900 truncate">{bh.boarding_name}</span>
                                    {selected == bh.id && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{bh.address}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="success" className="text-xs">{bh.available_rooms} available</Badge>
                                    {bh.room_rate > 0 && <span className="text-xs text-slate-500">₱{Number(bh.room_rate).toLocaleString()}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleAssign} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Assignment
                        </Button>
                        <Link to={`/students/${id}`}>
                            <Button variant="outline">Cancel</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
