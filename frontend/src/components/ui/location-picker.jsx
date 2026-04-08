import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './button';
import { Navigation, MapPin, X } from 'lucide-react';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// SKSU Kalamansig Campus Coordinates
const SKSU_KALAMANSIG = [6.2126, 124.3133];

// Custom draggable marker icon
const selectedIcon = L.divIcon({
    className: 'selected-marker',
    html: `<div style="
        background-color: #ef4444;
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

// Campus reference marker
const campusIcon = L.divIcon({
    className: 'campus-marker',
    html: `<div style="
        background-color: #3b82f6;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        opacity: 0.8;
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// Map click handler component
function MapClickHandler({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Center map on location component
function CenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 16);
        }
    }, [center, map]);
    return null;
}

export function LocationPicker({ 
    latitude, 
    longitude, 
    onLocationChange, 
    height = '300px',
    showCampusMarker = true,
}) {
    const [position, setPosition] = useState(
        latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : null
    );
    const [locating, setLocating] = useState(false);
    const [centerTrigger, setCenterTrigger] = useState(null);

    // Update position when props change
    useEffect(() => {
        if (latitude && longitude) {
            setPosition([parseFloat(latitude), parseFloat(longitude)]);
        }
    }, [latitude, longitude]);

    const handleLocationSelect = useCallback((lat, lng) => {
        const newPos = [lat, lng];
        setPosition(newPos);
        onLocationChange(lat.toFixed(6), lng.toFixed(6));
    }, [onLocationChange]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                handleLocationSelect(lat, lng);
                setCenterTrigger([lat, lng]);
                setLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Unable to get your location. Please click on the map to set location manually.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleClearLocation = () => {
        setPosition(null);
        onLocationChange('', '');
    };

    const handleCenterOnCampus = () => {
        setCenterTrigger(SKSU_KALAMANSIG);
    };

    const mapCenter = position || SKSU_KALAMANSIG;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleGetCurrentLocation}
                        disabled={locating}
                    >
                        <Navigation className={`h-4 w-4 mr-1 ${locating ? 'animate-pulse' : ''}`} />
                        {locating ? 'Locating...' : 'Use My Location'}
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={handleCenterOnCampus}
                    >
                        <MapPin className="h-4 w-4 mr-1" />
                        SKSU Campus
                    </Button>
                </div>
                {position && (
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={handleClearLocation}
                        className="text-red-500 hover:text-red-600"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>
            
            <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height }}>
                <MapContainer 
                    center={mapCenter} 
                    zoom={position ? 16 : 14} 
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    <CenterMap center={centerTrigger} />
                    
                    {/* SKSU Campus reference marker */}
                    {showCampusMarker && (
                        <Marker position={SKSU_KALAMANSIG} icon={campusIcon} />
                    )}
                    
                    {/* Selected location marker */}
                    {position && (
                        <Marker 
                            position={position} 
                            icon={selectedIcon}
                            draggable={true}
                            eventHandlers={{
                                dragend: (e) => {
                                    const marker = e.target;
                                    const pos = marker.getLatLng();
                                    handleLocationSelect(pos.lat, pos.lng);
                                },
                            }}
                        />
                    )}
                </MapContainer>
            </div>
            
            <p className="text-xs text-slate-500">
                Click on the map to set location, or drag the marker to adjust. 
                {position && (
                    <span className="ml-1 font-medium">
                        Selected: {position[0].toFixed(4)}, {position[1].toFixed(4)}
                    </span>
                )}
            </p>
        </div>
    );
}

export default LocationPicker;
