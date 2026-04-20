import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
    ArrowLeft, MapPin, Phone, Mail, User, Home, BedDouble,
    Users, Wifi, Car, Shield, Clock, Heart, MessageCircle, ExternalLink,
    ChevronLeft, ChevronRight, X, ImageIcon
} from 'lucide-react';
import StudentInquiryModal from './StudentInquiryModal';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function DetailItem({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2">
            <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function FacilityBadge({ facility }) {
    const icons = {
        'wifi': Wifi,
        'parking': Car,
        'security': Shield,
        'laundry': Home,
    };
    const Icon = icons[facility.toLowerCase()] || Home;
    return (
        <Badge variant="outline" className="gap-1">
            <Icon className="h-3 w-3" />
            {facility}
        </Badge>
    );
}

function RoomPhotoLightbox({ photos, initialIndex, onClose }) {
    const [current, setCurrent] = useState(initialIndex);

    const prev = () => setCurrent(i => (i - 1 + photos.length) % photos.length);
    const next = () => setCurrent(i => (i + 1) % photos.length);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const src = photos[current]?.photo_url || `/storage/${photos[current]?.photo_path}`;

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 bg-black border-0 overflow-hidden">
                <div className="relative flex items-center justify-center min-h-[400px]">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <img
                        src={src}
                        alt={`Room photo ${current + 1}`}
                        className="max-h-[70vh] w-full object-contain"
                    />

                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={prev}
                                className="absolute left-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={next}
                                className="absolute right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {photos.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                            />
                        ))}
                    </div>
                </div>

                {photos.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto bg-black/90 p-2">
                        {photos.map((photo, i) => {
                            const thumbSrc = photo.photo_url || `/storage/${photo.photo_path}`;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`shrink-0 h-14 w-14 overflow-hidden rounded border-2 transition-all ${i === current ? 'border-white' : 'border-transparent opacity-60 hover:opacity-90'}`}
                                >
                                    <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function RoomCard({ room, onViewPhoto }) {
    const photos = room.photos || [];
    const coverSrc = photos[0] ? (photos[0].photo_url || `/storage/${photos[0].photo_path}`) : null;

    return (
        <div className="border rounded-lg overflow-hidden hover:border-blue-200 transition-colors">
            {coverSrc ? (
                <div className="relative">
                    <img
                        src={coverSrc}
                        alt={room.room_name}
                        className="w-full h-40 object-cover cursor-pointer"
                        onClick={() => onViewPhoto(room, 0)}
                    />
                    {photos.length > 1 && (
                        <button
                            onClick={() => onViewPhoto(room, 0)}
                            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                        >
                            <ImageIcon className="h-3 w-3" />
                            {photos.length} photos
                        </button>
                    )}
                    {photos.length > 1 && (
                        <div className="absolute bottom-2 left-2 flex gap-1">
                            {photos.slice(1, 4).map((photo, i) => {
                                const src = photo.photo_url || `/storage/${photo.photo_path}`;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => onViewPhoto(room, i + 1)}
                                        className="h-10 w-10 overflow-hidden rounded border border-white/70"
                                    >
                                        <img src={src} alt="" className="h-full w-full object-cover" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex h-28 items-center justify-center bg-slate-100">
                    <BedDouble className="h-8 w-8 text-slate-300" />
                </div>
            )}

            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{room.room_name}</h4>
                    <span className="text-lg font-bold text-blue-600">
                        ₱{Number(room.price).toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {room.available_slots}/{room.capacity} slots
                    </span>
                    {room.gender_type && (
                        <Badge variant="secondary" className="text-xs">
                            {room.gender_type}
                        </Badge>
                    )}
                </div>
                {room.amenities && (
                    <p className="text-xs text-slate-400 mt-2">{room.amenities}</p>
                )}
            </div>
        </div>
    );
}

export default function StudentBoardingDetailPage() {
    const { id } = useParams();
    const [bh, setBh] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [lightbox, setLightbox] = useState(null); // { photos, index }

    useEffect(() => {
        setLoading(true);
        api.get(`/find-boarding/${id}`)
            .then(r => setBh(r.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const openLightbox = (room, index) => {
        if (room.photos?.length) {
            setLightbox({ photos: room.photos, index });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!bh) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
                <Home className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500">Boarding house not found.</p>
                <Link to="/find-boarding">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Search
                    </Button>
                </Link>
            </div>
        );
    }

    const facilities = bh.facilities?.split(',').map(f => f.trim()).filter(Boolean) || [];
    const availableRooms = bh.rooms?.filter(r => r.available_slots > 0) || [];

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <Link to="/find-boarding" className="inline-flex items-center text-blue-300 hover:text-blue-200 mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Search
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">{bh.boarding_name}</h1>
                            <p className="text-blue-200 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {bh.address}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={`text-sm px-3 py-1 ${
                                (bh.available_rooms || 0) >= 5 ? 'bg-green-500' :
                                (bh.available_rooms || 0) >= 1 ? 'bg-yellow-500' :
                                'bg-red-500'
                            }`}>
                                {bh.available_rooms || 0} rooms available
                            </Badge>
                            {bh.room_rate > 0 && (
                                <div className="text-right">
                                    <p className="text-xs text-blue-300">Starting at</p>
                                    <p className="text-xl font-bold">₱{Number(bh.room_rate).toLocaleString()}<span className="text-sm font-normal">/mo</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {bh.image_url && (
                            <Card className="overflow-hidden">
                                <img
                                    src={bh.image_url}
                                    alt={bh.boarding_name}
                                    className="w-full h-64 object-cover"
                                />
                            </Card>
                        )}

                        {bh.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">About this Boarding House</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 leading-relaxed">{bh.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {facilities.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Facilities & Amenities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {facilities.map((f, idx) => (
                                            <FacilityBadge key={idx} facility={f} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BedDouble className="h-4 w-4" />
                                    Available Rooms ({availableRooms.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {availableRooms.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No rooms available at the moment.</p>
                                        <p className="text-sm mt-1">Submit an inquiry to be notified when rooms become available.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {availableRooms.map(room => (
                                            <RoomCard
                                                key={room.id}
                                                room={room}
                                                onViewPhoto={openLightbox}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-blue-200 bg-blue-50/50">
                            <CardContent className="p-6 text-center">
                                <Heart className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                                <h3 className="font-semibold text-slate-900 mb-2">Interested in this place?</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Submit a reservation and the owner will contact you with more details.
                                </p>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={() => setShowInquiryModal(true)}
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Reserve a Room
                                </Button>
                            </CardContent>
                        </Card>

                        {bh.owner && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Contact Owner</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <DetailItem icon={User} label="Owner" value={bh.owner.full_name} />
                                    <DetailItem icon={Phone} label="Contact" value={bh.owner.contact_number} />
                                    <DetailItem icon={Mail} label="Email" value={bh.owner.email} />
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Requirements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        Valid school ID or enrollment certificate
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        2x2 ID photo
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        Parent/Guardian contact information
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        Advance payment (1-2 months)
                                    </li>
                                </ul>
                                <p className="text-xs text-slate-400 mt-3">
                                    * Requirements may vary. Contact the owner for specific details.
                                </p>
                            </CardContent>
                        </Card>

                        {(bh.latitude && bh.longitude) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Location
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="h-[250px] w-full">
                                        <MapContainer
                                            center={[bh.latitude, bh.longitude]}
                                            zoom={16}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={[bh.latitude, bh.longitude]}>
                                                <Popup>
                                                    <div className="text-center min-w-[140px]">
                                                        <p className="font-semibold text-sm">{bh.boarding_name}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{bh.address}</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                    <div className="p-3 border-t">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${bh.latitude},${bh.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            <Button variant="outline" size="sm" className="w-full">
                                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                                Open in Google Maps
                                            </Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <StudentInquiryModal
                open={showInquiryModal}
                onClose={() => setShowInquiryModal(false)}
                boardingHouse={bh}
            />

            {lightbox && (
                <RoomPhotoLightbox
                    photos={lightbox.photos}
                    initialIndex={lightbox.index}
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    );
}
