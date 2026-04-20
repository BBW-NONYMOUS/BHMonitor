import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LocationPicker } from '@/components/ui/location-picker';
import { ArrowLeft, Loader2, MapPin, Search, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function BoardingHouseFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = Boolean(id);
    const fileRef = useRef();

    const [form, setForm] = useState({
        boarding_name: '', address: '', description: '', facilities: '',
        latitude: '', longitude: '', status: 'active', owner_id: '',
    });
    const [owners, setOwners] = useState([]);
    const [ownerSearch, setOwnerSearch] = useState('');
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(() => !id);
    const hasPinnedLocation = Boolean(form.latitude && form.longitude);

    useEffect(() => {
        if (user?.role === 'admin') {
            api.get('/owners?per_page=200').then(r => {
                setOwners(r.data.data || []);
            });
        }
        if (isEdit) {
            api.get(`/boarding-houses/${id}`).then(r => {
                const bh = r.data;
                setForm({
                    boarding_name: bh.boarding_name || '',
                    address: bh.address || '',
                    description: bh.description || '',
                    facilities: bh.facilities || '',
                    latitude: bh.latitude || '',
                    longitude: bh.longitude || '',
                    status: bh.status || 'active',
                    owner_id: bh.owner_id || '',
                });
                if (bh.owner) {
                    setSelectedOwner(bh.owner);
                }
                // Show map if coordinates exist
                if (bh.latitude && bh.longitude) {
                    setShowMap(true);
                }
            });
        }
    }, [id]);

    // Update selected owner when owner_id changes
    useEffect(() => {
        if (form.owner_id && owners.length > 0) {
            const owner = owners.find(o => String(o.id) === String(form.owner_id));
            if (owner) setSelectedOwner(owner);
        }
    }, [form.owner_id, owners]);

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target?.value ?? e }));

    const handleLocationChange = (lat, lng) => {
        setForm(p => ({ ...p, latitude: lat, longitude: lng }));
    };

    // Filter owners based on search
    const filteredOwners = owners.filter(o => 
        o.full_name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
        (o.email && o.email.toLowerCase().includes(ownerSearch.toLowerCase())) ||
        (o.contact_number && o.contact_number.includes(ownerSearch))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const file = fileRef.current?.files[0];
        let payload;

        if (file) {
            payload = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== '') payload.append(k, v); });
            payload.append('image', file);
        } else {
            payload = form;
        }

        try {
            if (isEdit) {
                if (file) {
                    payload.append('_method', 'PUT');
                    await api.post(`/boarding-houses/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
                } else {
                    await api.put(`/boarding-houses/${id}`, payload);
                }
                toast.success('Boarding house updated.');
            } else {
                const cfg = file ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
                await api.post('/boarding-houses', payload, cfg);
                toast.success('Boarding house created.');
            }
            navigate('/boarding-houses');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                toast.error('Failed to save boarding house.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
                <Link to="/boarding-houses">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-2xl font-bold">{isEdit ? 'Edit' : 'Add'} Boarding House</h1>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-1">
                                <Label>Boarding House Name *</Label>
                                <Input value={form.boarding_name} onChange={set('boarding_name')} required />
                                {errors.boarding_name && <p className="text-xs text-red-500">{errors.boarding_name[0]}</p>}
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                                <Label>Address *</Label>
                                <Input value={form.address} onChange={set('address')} required />
                                {errors.address && <p className="text-xs text-red-500">{errors.address[0]}</p>}
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                                <Label>Description</Label>
                                <textarea
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={3}
                                    value={form.description}
                                    onChange={set('description')}
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                                <Label>Facilities</Label>
                                <Input placeholder="e.g. WiFi, Water, Electricity" value={form.facilities} onChange={set('facilities')} />
                            </div>

                            {/* Location Section */}
                            <div className="sm:col-span-2 space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                        Location
                                    </Label>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setShowMap(!showMap)}
                                    >
                                        {showMap ? 'Hide Map' : 'Show Pin Map'}
                                    </Button>
                                </div>

                                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="max-w-xl">
                                            <p className="text-sm font-semibold text-slate-900">
                                                Pin the boarding house during registration
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                This saved map pin will be shown to students so they can easily find the exact boarding house location.
                                            </p>
                                        </div>
                                        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            hasPinnedLocation
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {hasPinnedLocation ? 'Pin saved' : 'Pin not set'}
                                        </div>
                                    </div>
                                    {hasPinnedLocation && (
                                        <p className="mt-3 text-xs font-medium text-blue-700">
                                            Saved coordinates: {form.latitude}, {form.longitude}
                                        </p>
                                    )}
                                </div>
                                
                                {showMap && (
                                    <LocationPicker
                                        latitude={form.latitude}
                                        longitude={form.longitude}
                                        onLocationChange={handleLocationChange}
                                        height="250px"
                                    />
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Latitude</Label>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            value={form.latitude} 
                                            onChange={set('latitude')} 
                                            placeholder="e.g. 6.5575957" 
                                        />
                                        {errors.latitude && <p className="text-xs text-red-500">{errors.latitude[0]}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Longitude</Label>
                                        <Input 
                                            type="number" 
                                            step="any" 
                                            value={form.longitude} 
                                            onChange={set('longitude')} 
                                            placeholder="e.g. 124.048627" 
                                        />
                                        {errors.longitude && <p className="text-xs text-red-500">{errors.longitude[0]}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={set('status')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Enhanced Owner Selection */}
                            {user?.role === 'admin' && (
                                <div className="sm:col-span-2 space-y-3 pt-2 border-t">
                                    <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-blue-600" />
                                        Owner Information *
                                    </Label>
                                    
                                    {/* Owner Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Search owner by name, email, or phone..." 
                                            value={ownerSearch}
                                            onChange={(e) => setOwnerSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    
                                    {/* Owner Select */}
                                    <Select 
                                        value={String(form.owner_id || '')} 
                                        onValueChange={v => {
                                            setForm(p => ({ ...p, owner_id: v }));
                                            const owner = owners.find(o => String(o.id) === v);
                                            if (owner) setSelectedOwner(owner);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select owner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredOwners.length === 0 ? (
                                                <div className="px-3 py-2 text-sm text-slate-500">No owners found</div>
                                            ) : (
                                                filteredOwners.map(o => (
                                                    <SelectItem key={o.id} value={String(o.id)}>
                                                        <div className="flex flex-col">
                                                            <span>{o.full_name}</span>
                                                            {o.email && <span className="text-xs text-slate-400">{o.email}</span>}
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.owner_id && <p className="text-xs text-red-500">{errors.owner_id[0]}</p>}
                                    
                                    {/* Selected Owner Details */}
                                    {selectedOwner && (
                                        <div className="p-3 bg-slate-50 rounded-lg border">
                                            <p className="font-medium text-slate-900">{selectedOwner.full_name}</p>
                                            <div className="mt-2 space-y-1">
                                                {selectedOwner.contact_number && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {selectedOwner.contact_number}
                                                    </div>
                                                )}
                                                {selectedOwner.email && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {selectedOwner.email}
                                                    </div>
                                                )}
                                                {selectedOwner.address && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {selectedOwner.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="sm:col-span-2 space-y-1">
                                <Label>Photo</Label>
                                <input ref={fileRef} type="file" accept="image/*" className="text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200 cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Update' : 'Create'} Boarding House
                            </Button>
                            <Link to="/boarding-houses">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
