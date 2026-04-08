import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// SKSU Kalamansig Campus Coordinates
const SKSU_KALAMANSIG = [6.2126, 124.3133];

// Custom marker for boarding house
const bhMarkerIcon = L.divIcon({
    className: 'bh-marker',
    html: `<div style="
        background-color: #ef4444;
        width: 16px;
        height: 16px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
});

// Campus marker (smaller for mini-map)
const campusMarkerIcon = L.divIcon({
    className: 'campus-marker-mini',
    html: `<div style="
        background-color: #3b82f6;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

/**
 * MiniMap - A lightweight, non-interactive map preview component
 * Shows a boarding house location relative to SKSU campus
 * 
 * @param {number} latitude - Boarding house latitude
 * @param {number} longitude - Boarding house longitude
 * @param {string} className - Additional CSS classes
 * @param {number} height - Map height in pixels (default: 120)
 * @param {boolean} showCampus - Whether to show campus marker (default: true)
 * @param {boolean} showLine - Whether to draw line to campus (default: true)
 */
export function MiniMap({ 
    latitude, 
    longitude, 
    className,
    height = 120,
    showCampus = true,
    showLine = true,
}) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current || !latitude || !longitude) return;

        // Clean up existing map
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const position = [parseFloat(latitude), parseFloat(longitude)];
        
        // Calculate center between BH and campus for better view
        const centerLat = (position[0] + SKSU_KALAMANSIG[0]) / 2;
        const centerLng = (position[1] + SKSU_KALAMANSIG[1]) / 2;

        // Create map
        const map = L.map(mapRef.current, {
            center: [centerLat, centerLng],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
        });

        // Use Carto Voyager for clean Google-like appearance
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

        // Add boarding house marker
        L.marker(position, { icon: bhMarkerIcon }).addTo(map);

        // Add campus marker
        if (showCampus) {
            L.marker(SKSU_KALAMANSIG, { icon: campusMarkerIcon }).addTo(map);
        }

        // Draw line from BH to campus
        if (showLine && showCampus) {
            L.polyline([position, SKSU_KALAMANSIG], {
                color: '#3b82f6',
                weight: 2,
                opacity: 0.6,
                dashArray: '5, 5',
            }).addTo(map);
        }

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([position, SKSU_KALAMANSIG]);
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [latitude, longitude, showCampus, showLine]);

    if (!latitude || !longitude) {
        return (
            <div 
                className={cn(
                    "bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs",
                    className
                )}
                style={{ height }}
            >
                No location
            </div>
        );
    }

    return (
        <div 
            ref={mapRef}
            className={cn("rounded-lg overflow-hidden border border-slate-200", className)}
            style={{ height, minWidth: 150 }}
        />
    );
}

export default MiniMap;
