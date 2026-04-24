import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Home, Building2, Navigation, Map, List, School, Phone, User } from 'lucide-react';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// SKSU Kalamansig Campus Coordinates
const SKSU_KALAMANSIG = [6.5575957, 124.048627];

// Custom marker icons with availability count badge
const createCustomIcon = (color, available, size = 30) => {
    const badgeColor = available >= 1 ? '#16a34a' : '#dc2626';
    const badgeBg = available >= 1 ? '#dcfce7' : '#fee2e2';
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="position: relative;">
            <div style="
                background-color: ${color};
                width: ${size}px;
                height: ${size}px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>
            <div style="
                position: absolute;
                top: -8px;
                right: -8px;
                background-color: ${badgeBg};
                color: ${badgeColor};
                font-size: 10px;
                font-weight: 700;
                min-width: 18px;
                height: 18px;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1.5px solid ${badgeColor};
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">${available ?? 0}</div>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
};

// Campus icon
const campusIcon = L.divIcon({
    className: 'campus-marker',
    html: `<div style="
        background-color: #3b82f6;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
    ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>
    </div>`,
    iconSize: [35, 35],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
});

const studentLocationIcon = L.divIcon({
    className: 'student-location-marker',
    html: `<div style="
        position: relative;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    ">
        <div style="
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            background: rgba(37, 99, 235, 0.22);
            border: 1px solid rgba(37, 99, 235, 0.3);
        "></div>
        <div style="
            width: 10px;
            height: 10px;
            border-radius: 9999px;
            background: #2563eb;
            border: 2px solid white;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
        "></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
});

const getMarkerIcon = (available) => {
    if (available === null || available === undefined) return createCustomIcon('#9ca3af', 0);
    if (available >= 1) return createCustomIcon('#22c55e', available);
    return createCustomIcon('#ef4444', available);
};

// Compute availability status based on room availability count
const computeAvailabilityStatus = (available) => {
    if (available === null || available === undefined || available === 0) return 'full';
    return 'available';
};

// Calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const formatDistanceLabel = (distance, hasStudentLocation) =>
    `${distance.toFixed(2)} km ${hasStudentLocation ? 'from your location' : 'from SKSU campus'}`;

function MapViewport({ markers, coords }) {
    const map = useMap();

    useEffect(() => {
        const points = [L.latLng(SKSU_KALAMANSIG[0], SKSU_KALAMANSIG[1])];

        if (coords) {
            points.push(L.latLng(coords.lat, coords.lng));
        }

        markers.forEach((marker) => {
            if (Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude)) {
                points.push(L.latLng(marker.latitude, marker.longitude));
            }
        });

        if (points.length === 1) {
            map.setView(points[0], 15);
            return;
        }

        map.fitBounds(L.latLngBounds(points), {
            padding: [36, 36],
            maxZoom: coords ? 16 : 15,
        });
    }, [map, markers, coords]);

    return null;
}

export default function FindBoardingPage() {
    const [results, setResults] = useState([]);
    const [mapMarkers, setMapMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [availabilityFilter, setAvailabilityFilter] = useState([]); // ['available', 'full']
    const [filters, setFilters] = useState({
        search: '', max_price: '', gender_type: '', sort: 'latest',
    });
    const hasStudentLocation = Boolean(coords);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
                ...(availabilityFilter.length > 0 ? { availability: availabilityFilter.join(',') } : {}),
            };
            const { data } = await api.get('/find-boarding', { params });
            setResults(data.data || data);
        } finally {
            setLoading(false);
        }
    };

    const fetchMapMarkers = async () => {
        try {
            const { data } = await api.get('/find-boarding/markers');
            setMapMarkers(data);
        } catch (e) {
            console.error('Failed to fetch map markers', e);
        }
    };

    useEffect(() => { fetchResults(); }, [filters, coords, availabilityFilter]);
    useEffect(() => { fetchMapMarkers(); }, []);

    // Add distance to markers and apply availability filter
    const markersWithDistance = useMemo(() => {
        let markers = mapMarkers
            .filter(m => Number.isFinite(Number(m.latitude)) && Number.isFinite(Number(m.longitude)))
            .map(m => {
                const latitude = Number(m.latitude);
                const longitude = Number(m.longitude);
                const distanceFromCampus = calculateDistance(
                    SKSU_KALAMANSIG[0],
                    SKSU_KALAMANSIG[1],
                    latitude,
                    longitude
                );
                const distanceFromStudent = coords
                    ? calculateDistance(coords.lat, coords.lng, latitude, longitude)
                    : null;

                return {
                    ...m,
                    latitude,
                    longitude,
                    distance: distanceFromStudent ?? distanceFromCampus,
                    distanceFromCampus,
                    distanceFromStudent,
                    availability_status: computeAvailabilityStatus(m.available)
                };
            })
            .sort((a, b) => a.distance - b.distance);

        // Apply availability filter if any filters are selected
        if (availabilityFilter.length > 0) {
            markers = markers.filter(m => availabilityFilter.includes(m.availability_status));
        }

        return markers;
    }, [mapMarkers, availabilityFilter, coords]);

    const getLocation = () => {
        navigator.geolocation?.getCurrentPosition(pos => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    };

    const set = (field) => (val) => setFilters(p => ({ ...p, [field]: val }));

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-12 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="flex justify-center mb-4">
                        <Home className="h-12 w-12 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Find a Boarding House near SKSU Kalamansig</h1>
                    <p className="text-blue-200">Browse available boarding houses near Sultan Kudarat State University - Kalamansig Campus.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* View Toggle & Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4 mr-1" />
                                    List
                                </Button>
                                <Button
                                    variant={viewMode === 'map' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setViewMode('map')}
                                >
                                    <Map className="h-4 w-4 mr-1" />
                                    Map
                                </Button>
                            </div>
                            {/* Legend */}
                            <div className="hidden sm:flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                    Available
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                    Full
                                </span>
                            </div>
                        </div>

                        {/* Availability Filter Buttons - REQ-014 */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-sm text-slate-500 mr-1">Filter by status:</span>
                            <Button
                                variant={availabilityFilter.includes('available') ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setAvailabilityFilter(prev =>
                                        prev.includes('available')
                                            ? prev.filter(s => s !== 'available')
                                            : [...prev, 'available']
                                    );
                                }}
                                className={availabilityFilter.includes('available') ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}
                            >
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                                Available
                            </Button>
                            <Button
                                variant={availabilityFilter.includes('full') ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setAvailabilityFilter(prev =>
                                        prev.includes('full')
                                            ? prev.filter(s => s !== 'full')
                                            : [...prev, 'full']
                                    );
                                }}
                                className={availabilityFilter.includes('full') ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'}
                            >
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                                Full
                            </Button>
                            {availabilityFilter.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setAvailabilityFilter([])}
                                    className="text-slate-500"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="relative lg:col-span-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-9"
                                    value={filters.search}
                                    onChange={e => set('search')(e.target.value)}
                                />
                            </div>
                            <Input
                                placeholder="Max price (₱)"
                                type="number"
                                value={filters.max_price}
                                onChange={e => set('max_price')(e.target.value)}
                            />
                            <Select value={filters.gender_type} onValueChange={set('gender_type')}>
                                <SelectTrigger><SelectValue placeholder="Any gender" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any gender</SelectItem>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Mixed">Mixed</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Select value={filters.sort} onValueChange={set('sort')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="latest">Latest</SelectItem>
                                        <SelectItem value="price_asc">Lowest Price</SelectItem>
                                        <SelectItem value="nearest">Nearest</SelectItem>
                                    </SelectContent>
                                </Select>
                                {filters.sort === 'nearest' && (
                                    <Button variant="outline" size="icon" onClick={getLocation} title="Get my location">
                                        <Navigation className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Map View */}
                {viewMode === 'map' && (
                    <div className="mb-6">
                        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                            <div className="flex items-center gap-2 font-medium">
                                <MapPin className="h-4 w-4" />
                                Registered boarding houses are pinned on this map.
                            </div>
                            <div className="text-blue-800/80">
                                {hasStudentLocation
                                    ? 'Distances are based on your current location.'
                                    : 'Turn on your location to compare boarding houses from where you are.'}
                            </div>
                            {hasStudentLocation && (
                                <div className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700">
                                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                                </div>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                                <Button
                                    variant={hasStudentLocation ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={getLocation}
                                    className={hasStudentLocation ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-700 hover:bg-blue-100'}
                                >
                                    <Navigation className="mr-1 h-4 w-4" />
                                    {hasStudentLocation ? 'Refresh my location' : 'Use my location'}
                                </Button>
                                {hasStudentLocation && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCoords(null)}
                                        className="text-blue-700 hover:bg-blue-100"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '500px' }}>
                            <MapContainer center={SKSU_KALAMANSIG} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <MapViewport markers={markersWithDistance} coords={coords} />
                                {/* Satellite view by default - ESRI World Imagery - REQ-015 */}
                                <TileLayer
                                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                />
                                {/* Labels overlay for better readability */}
                                <TileLayer
                                    attribution='&copy; Esri'
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                                    opacity={0.7}
                                />
                                
                                {/* SKSU Campus Marker */}
                                <Marker position={SKSU_KALAMANSIG} icon={campusIcon}>
                                    <Popup>
                                        <div className="text-center p-2">
                                            <School className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                                            <p className="font-bold text-slate-900">SKSU Kalamansig Campus</p>
                                            <p className="text-xs text-slate-500 mt-1">Sultan Kudarat State University</p>
                                        </div>
                                    </Popup>
                                </Marker>
                                
                                {/* Campus radius circle (1km) */}
                                <Circle
                                    center={SKSU_KALAMANSIG}
                                    radius={1000}
                                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
                                />

                                {hasStudentLocation && (
                                    <>
                                        <Circle
                                            center={[coords.lat, coords.lng]}
                                            radius={180}
                                            pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.14, weight: 1.5 }}
                                        />
                                        <Marker position={[coords.lat, coords.lng]} icon={studentLocationIcon}>
                                            <Popup>
                                                <div className="text-center p-2">
                                                    <Navigation className="mx-auto mb-2 h-5 w-5 text-blue-600" />
                                                    <p className="font-bold text-slate-900">Your current location</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Boarding houses are sorted by distance from this point.
                                                    </p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </>
                                )}

                                {/* Boarding House Markers */}
                                {markersWithDistance.map(m => (
                                    <Marker key={m.id} position={[m.latitude, m.longitude]} icon={getMarkerIcon(m.available)}>
                                        <Popup>
                                            <div className="min-w-[200px]">
                                                <p className="font-bold text-slate-900 text-base mb-1">{m.name}</p>
                                                <p className="text-xs text-slate-500 mb-2">{m.address}</p>
                                                
                                                {/* Availability Badge */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        (m.available || 0) >= 1 ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {m.available || 0} room{(m.available || 0) !== 1 ? 's' : ''} available
                                                    </span>
                                                </div>

                                                {/* Distance & Price */}
                                                <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {formatDistanceLabel(m.distance, hasStudentLocation)}
                                                    </span>
                                                    {m.rate > 0 && (
                                                        <span className="font-medium text-emerald-600">
                                                            ₱{Number(m.rate).toLocaleString()}/mo
                                                        </span>
                                                    )}
                                                </div>

                                                {hasStudentLocation && (
                                                    <p className="mb-2 text-xs text-slate-500">
                                                        {m.distanceFromCampus.toFixed(2)} km from SKSU campus
                                                    </p>
                                                )}

                                                <a 
                                                    href={`/find-boarding/${m.id}`}
                                                    className="block mt-2 w-full text-center text-sm text-white bg-blue-600 hover:bg-blue-700 py-1.5 rounded-md transition-colors"
                                                >
                                                    View Details
                                                </a>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Showing {markersWithDistance.length} registered boarding houses near SKSU Kalamansig Campus.
                            {' '}The large blue circle indicates 1km from campus.
                            {hasStudentLocation && ' The smaller blue circle marks your current location.'}
                        </p>
                    </div>
                )}

                {/* List Results */}
                {viewMode === 'list' && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                <p>No boarding houses found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {results.map(bh => (
                                    <Card key={bh.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="font-semibold text-slate-900">{bh.boarding_name}</h3>
                                                <Badge className={`${
                                                    (bh.available_rooms || 0) >= 1 ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {bh.available_rooms || 0} available
                                                </Badge>
                                            </div>
                                            <div className="flex items-start gap-1 text-sm text-slate-500 mb-3">
                                                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                                <span>{bh.address}</span>
                                            </div>
                                            {bh.facilities && (
                                                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{bh.facilities}</p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    {bh.room_rate > 0 && (
                                                        <span className="font-semibold text-blue-600">
                                                            ₱{Number(bh.room_rate).toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
                                                        </span>
                                                    )}
                                                    {bh.distance != null && (
                                                        <span className="text-xs text-slate-400 ml-2">{bh.distance.toFixed(1)} km away</span>
                                                    )}
                                                </div>
                                                <a href={`/find-boarding/${bh.id}`} className="text-sm text-blue-600 hover:underline font-medium">
                                                    View Details →
                                                </a>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
