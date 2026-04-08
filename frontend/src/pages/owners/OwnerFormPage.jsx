import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function OwnerFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        name: '', email: '', password: '',
        full_name: '', contact_number: '', address: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.get(`/owners/${id}`).then(r => {
                const o = r.data;
                setForm({
                    name: o.user?.name || '',
                    email: o.email || '',
                    password: '',
                    full_name: o.full_name || '',
                    contact_number: o.contact_number || '',
                    address: o.address || '',
                });
            });
        }
    }, [id]);

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const payload = isEdit
            ? { full_name: form.full_name, email: form.email, contact_number: form.contact_number, address: form.address }
            : form;

        try {
            if (isEdit) {
                await api.put(`/owners/${id}`, payload);
                toast.success('Owner updated.');
            } else {
                await api.post('/owners', payload);
                toast.success('Owner created.');
            }
            navigate('/owners');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                toast.error('Failed to save owner.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center gap-3">
                <Link to="/owners">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-2xl font-bold">{isEdit ? 'Edit' : 'Add'} Owner</h1>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <Label>Full Name *</Label>
                                <Input value={form.full_name} onChange={set('full_name')} required />
                                {errors.full_name && <p className="text-xs text-red-500">{errors.full_name[0]}</p>}
                            </div>

                            {!isEdit && (
                                <div className="space-y-1">
                                    <Label>Username *</Label>
                                    <Input value={form.name} onChange={set('name')} required />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name[0]}</p>}
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label>Email *</Label>
                                <Input type="email" value={form.email} onChange={set('email')} required />
                                {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                            </div>

                            {!isEdit && (
                                <div className="space-y-1">
                                    <Label>Password *</Label>
                                    <Input type="password" value={form.password} onChange={set('password')} required />
                                    {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label>Contact Number</Label>
                                <Input value={form.contact_number} onChange={set('contact_number')} />
                            </div>

                            <div className="space-y-1">
                                <Label>Address</Label>
                                <Input value={form.address} onChange={set('address')} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Update' : 'Create'} Owner
                            </Button>
                            <Link to="/owners">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
