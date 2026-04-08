import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Filter, Maximize, Navigation, School, Phone, Mail, User, Layers } from 'lucide-react';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// SKSU Kalamansig Campus Coordinates
const SKSU_KALAMANSIG = [6.2126, 124.3133];
const DEFAULT_CENTER = SKSU_KALAMANSIG;

// Map tile layers configuration - includes Google-like alternatives (free)
const MAP_LAYERS = {
    street: {
        name: 'Street',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
    terrain: {
        name: 'Terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
    roads: {
        name: 'Roads',
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Humanitarian',
    },
    // Google Maps-like alternatives (free, no API key required)
    cartoLight: {
        name: 'Carto Light',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
    cartoDark: {
        name: 'Carto Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
    cartoVoyager: {
        name: 'Voyager',
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
    esriStreet: {
        name: 'Esri Streets',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
};

// Custom marker icons with availability count badge
const createCustomIcon = (color, available, size = 30) => {
    const badgeColor = available >= 5 ? '#16a34a' : available >= 1 ? '#ca8a04' : '#dc2626';
    const badgeBg = available >= 5 ? '#dcfce7' : available >= 1 ? '#fef9c3' : '#fee2e2';
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

const getMarkerIcon = (available) => {
    if (available === null || available === undefined) return createCustomIcon('#9ca3af', 0); // gray - unknown
    if (available >= 5) return createCustomIcon('#22c55e', available); // green - many available
    if (available >= 1) return createCustomIcon('#eab308', available); // yellow - limited
    return createCustomIcon('#ef4444', available); // red - full
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

// Map controls component
function MapControls({ onLocate, onFullscreen, mapStyle, onStyleChange }) {
    const [showStyles, setShowStyles] = useState(false);

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button size="sm" variant="secondary" onClick={onLocate} className="shadow-md">
                <Navigation className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={onFullscreen} className="shadow-md">
                <Maximize className="h-4 w-4" />
            </Button>
            <div className="relative">
                <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => setShowStyles(!showStyles)} 
                    className="shadow-md"
                >
                    <Layers className="h-4 w-4" />
                </Button>
                {showStyles && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border overflow-hidden">
                        {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    onStyleChange(key);
                                    setShowStyles(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors ${
                                    mapStyle === key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                }`}
                            >
                                {layer.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Locate user component
function LocateControl({ trigger }) {
    const map = useMap();
    
    useEffect(() => {
        if (trigger) {
            map.locate({ setView: true, maxZoom: 16 });
        }
    }, [trigger, map]);
    
    return null;
}

export default function MapPage() {
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [locateTrigger, setLocateTrigger] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapStyle, setMapStyle] = useState('street');
    
    // Filter states
    const [filters, setFilters] = useState({
        availability: 'all', // all, available, limited, full
        maxDistance: '', // km from campus
        maxPrice: '',
        search: '',
    });

    useEffect(() => {
        api.get('/map/markers')
            .then(r => setMarkers(r.data))
            .finally(() => setLoading(false));
    }, []);

    // Calculate distance for each marker and apply filters
    const filteredMarkers = useMemo(() => {
        return markers
            .map(m => ({
                ...m,
                distance: calculateDistance(SKSU_KALAMANSIG[0], SKSU_KALAMANSIG[1], m.latitude, m.longitude)
            }))
            .filter(m => {
                // Search filter
                if (filters.search && !m.name.toLowerCase().includes(filters.search.toLowerCase()) &&
                    !m.address.toLowerCase().includes(filters.search.toLowerCase())) {
                    return false;
                }
                // Availability filter
                if (filters.availability === 'available' && (m.available || 0) < 5) return false;
                if (filters.availability === 'limited' && ((m.available || 0) < 1 || (m.available || 0) >= 5)) return false;
                if (filters.availability === 'full' && (m.available || 0) > 0) return false;
                // Distance filter
                if (filters.maxDistance && m.distance > parseFloat(filters.maxDistance)) return false;
                // Price filter
                if (filters.maxPrice && m.rate > parseFloat(filters.maxPrice)) return false;
                return true;
            })
            .sort((a, b) => a.distance - b.distance);
    }, [markers, filters]);

    const handleLocate = () => setLocateTrigger(t => t + 1);
    
    const handleFullscreen = () => {
        const mapContainer = document.getElementById('map-container');
        if (!document.fullscreenElement) {
            mapContainer?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Stats
    const stats = useMemo(() => ({
        total: markers.length,
        available: markers.filter(m => (m.available || 0) >= 5).length,
        limited: markers.filter(m => (m.available || 0) >= 1 && (m.available || 0) < 5).length,
        full: markers.filter(m => (m.available || 0) === 0).length,
    }), [markers]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Link to="/boarding-houses">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Boarding Houses Near SKSU Kalamansig</h1>
                        <p className="text-slate-500 text-sm">Find available boarding houses near the campus.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="h-4 w-4 mr-1" />
                        Filters
                    </Button>
                    <Badge variant="secondary">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {filteredMarkers.length} location{filteredMarkers.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-slate-600">Available ({stats.available})</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="text-slate-600">Limited ({stats.limited})</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-slate-600">Full ({stats.full})</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-slate-600">SKSU Campus</span>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
                    <div className="space-y-1">
                        <Label className="text-xs">Search</Label>
                        <Input
                            placeholder="Name or address..."
                            value={filters.search}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Availability</Label>
                        <Select value={filters.availability} onValueChange={v => setFilters(f => ({ ...f, availability: v }))}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="available">Available (5+ rooms)</SelectItem>
                                <SelectItem value="limited">Limited (1-4 rooms)</SelectItem>
                                <SelectItem value="full">Full (0 rooms)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Max Distance from Campus (km)</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 2"
                            value={filters.maxDistance}
                            onChange={e => setFilters(f => ({ ...f, maxDistance: e.target.value }))}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Max Price (₱/month)</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 3000"
                            value={filters.maxPrice}
                            onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                            className="h-9"
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : (
                <div id="map-container" className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: isFullscreen ? '100vh' : '600px' }}>
                    <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            key={mapStyle}
                            attribution={MAP_LAYERS[mapStyle].attribution}
                            url={MAP_LAYERS[mapStyle].url}
                        />
                        <LocateControl trigger={locateTrigger} />
                        
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

                        {/* Boarding House Markers */}
                        {filteredMarkers.map(m => (
                            <Marker key={m.id} position={[m.latitude, m.longitude]} icon={getMarkerIcon(m.available)}>
                                <Popup>
                                    <div className="min-w-[220px]">
                                        <p className="font-bold text-slate-900 text-base mb-1">{m.name}</p>
                                        <p className="text-xs text-slate-500 mb-3">{m.address}</p>
                                        
                                        {/* Availability Badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                (m.available || 0) >= 5 ? 'bg-green-100 text-green-700' :
                                                (m.available || 0) >= 1 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {(m.available || 0) >= 5 ? 'Available' :
                                                 (m.available || 0) >= 1 ? 'Limited' : 'Full'}
                                            </span>
                                            <span className="text-xs text-slate-600">
                                                {m.available || 0} room{(m.available || 0) !== 1 ? 's' : ''} available
                                            </span>
                                        </div>

                                        {/* Distance & Price */}
                                        <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {m.distance.toFixed(2)} km from campus
                                            </span>
                                            {m.rate > 0 && (
                                                <span className="font-medium text-emerald-600">
                                                    ₱{Number(m.rate).toLocaleString()}/mo
                                                </span>
                                            )}
                                        </div>

                                        {/* Owner Info */}
                                        {m.owner && (
                                            <div className="border-t pt-2 mt-2">
                                                <p className="text-xs text-slate-500 mb-1">Owner</p>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700">{m.owner}</span>
                                                </div>
                                                {m.owner_contact && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Phone className="h-3 w-3 text-slate-400" />
                                                        <span className="text-xs text-slate-600">{m.owner_contact}</span>
                                                    </div>
                                                )}
                                                {m.owner_email && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                        <span className="text-xs text-slate-600">{m.owner_email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <Link to={`/boarding-houses/${m.id}`}>
                                            <button className="mt-3 w-full text-sm text-white bg-blue-600 hover:bg-blue-700 py-1.5 rounded-md transition-colors">
                                                View Details
                                            </button>
                                        </Link>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                    <MapControls 
                        onLocate={handleLocate} 
                        onFullscreen={handleFullscreen}
                        mapStyle={mapStyle}
                        onStyleChange={setMapStyle}
                    />
                </div>
            )}

            {filteredMarkers.length === 0 && !loading && (
                <p className="text-center text-slate-400 text-sm">
                    {markers.length === 0 
                        ? 'No active boarding houses with coordinates found.'
                        : 'No boarding houses match your filters.'}
                </p>
            )}

            {/* Boarding Houses List */}
            {filteredMarkers.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Nearby Boarding Houses ({filteredMarkers.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMarkers.slice(0, 6).map(m => (
                            <Link key={m.id} to={`/boarding-houses/${m.id}`} className="block">
                                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{m.name}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{m.address}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            (m.available || 0) >= 5 ? 'bg-green-100 text-green-700' :
                                            (m.available || 0) >= 1 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {m.available || 0} rooms
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 text-sm text-slate-600">
                                        <span>{m.distance.toFixed(2)} km</span>
                                        {m.rate > 0 && <span className="text-emerald-600 font-medium">₱{Number(m.rate).toLocaleString()}/mo</span>}
                                    </div>
                                    {m.owner && <p className="text-xs text-slate-400 mt-2">Owner: {m.owner}</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                    {filteredMarkers.length > 6 && (
                        <p className="text-center text-sm text-slate-500 mt-4">
                            Showing 6 of {filteredMarkers.length} boarding houses. View more on the map.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
