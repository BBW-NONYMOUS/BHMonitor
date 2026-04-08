import * as React from 'react';
import { useState } from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Map tile layer configurations
 * Available styles: street, satellite, terrain, roads
 */
export const MAP_LAYERS = {
    street: {
        name: 'Street',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        description: 'Standard street map view',
    },
    satellite: {
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        description: 'Satellite imagery view',
    },
    terrain: {
        name: 'Terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        description: 'Topographic terrain view',
    },
    roads: {
        name: 'Roads',
        url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Humanitarian',
        description: 'Humanitarian road-focused view',
    },
};

/**
 * Reusable MapStyleToggle component for switching map tile layers
 * @param {string} value - Current selected map style key
 * @param {function} onChange - Callback when style changes
 * @param {string[]} styles - Array of style keys to show (default: all)
 * @param {string} className - Additional CSS classes
 * @param {string} position - Position: 'dropdown' | 'inline' (default: 'dropdown')
 */
const MapStyleToggle = React.forwardRef(
    ({ value = 'street', onChange, styles, className, position = 'dropdown', ...props }, ref) => {
        const [isOpen, setIsOpen] = useState(false);

        const availableStyles = styles
            ? Object.entries(MAP_LAYERS).filter(([key]) => styles.includes(key))
            : Object.entries(MAP_LAYERS);

        if (position === 'inline') {
            return (
                <div ref={ref} className={cn('flex gap-1 p-1 bg-white rounded-lg shadow-md', className)} {...props}>
                    {availableStyles.map(([key, layer]) => (
                        <Button
                            key={key}
                            size="sm"
                            variant={value === key ? 'default' : 'ghost'}
                            onClick={() => onChange?.(key)}
                            className="text-xs"
                        >
                            {layer.name}
                        </Button>
                    ))}
                </div>
            );
        }

        return (
            <div ref={ref} className={cn('relative', className)} {...props}>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsOpen(!isOpen)}
                    className="shadow-md"
                    title="Change map style"
                >
                    <Layers className="h-4 w-4" />
                </Button>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[999]"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border overflow-hidden z-[1000]">
                            {availableStyles.map(([key, layer]) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        onChange?.(key);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        'w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors',
                                        value === key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'
                                    )}
                                >
                                    {layer.name}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }
);

MapStyleToggle.displayName = 'MapStyleToggle';

export { MapStyleToggle };
