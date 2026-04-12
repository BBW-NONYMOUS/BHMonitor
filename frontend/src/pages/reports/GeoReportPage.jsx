import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [10.3157, 123.8854];

export default function GeoReportPage() {
    const [houses, setHouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reports/geo')
            .then((r) => setHouses(r.data))
            .finally(() => setLoading(false));
    }, []);

    const withCoords = houses.filter((bh) => bh.latitude && bh.longitude);
    const center = withCoords.length > 0 ? [withCoords[0].latitude, withCoords[0].longitude] : DEFAULT_CENTER;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Geo Report</h1>
                    <p className="text-sm text-slate-500">Geographic distribution of boarding houses.</p>
                </div>
                <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />Print / Export
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{houses.length}</p><p className="mt-1 text-xs text-slate-500">Total Houses</p></CardContent></Card>
                <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{withCoords.length}</p><p className="mt-1 text-xs text-slate-500">With GPS Coordinates</p></CardContent></Card>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
            ) : (
                <>
                    {withCoords.length > 0 && (
                        <div className="h-[320px] overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:h-[450px]">
                            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {withCoords.map((bh) => (
                                    <Marker key={bh.id} position={[bh.latitude, bh.longitude]}>
                                        <Popup>
                                            <div className="min-w-[160px]">
                                                <p className="mb-1 font-semibold">{bh.boarding_name}</p>
                                                <p className="mb-1 text-xs text-slate-500">{bh.address}</p>
                                                <p className="text-xs font-medium text-blue-600">{bh.students_count} resident{bh.students_count !== 1 ? 's' : ''}</p>
                                                <Link to={`/boarding-houses/${bh.id}`}>
                                                    <button className="mt-1 text-xs text-blue-600 hover:underline">View Details</button>
                                                </Link>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" />Location Data</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Boarding House</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Latitude</TableHead>
                                        <TableHead>Longitude</TableHead>
                                        <TableHead className="text-right">Residents</TableHead>
                                        <TableHead>GPS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {houses.map((bh) => (
                                        <TableRow key={bh.id}>
                                            <TableCell className="font-medium">
                                                <Link to={`/boarding-houses/${bh.id}`} className="text-blue-600 hover:underline">
                                                    {bh.boarding_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-sm text-slate-500">{bh.address}</TableCell>
                                            <TableCell className="font-mono text-xs">{bh.latitude ?? '-'}</TableCell>
                                            <TableCell className="font-mono text-xs">{bh.longitude ?? '-'}</TableCell>
                                            <TableCell className="text-right">{bh.students_count ?? 0}</TableCell>
                                            <TableCell>{bh.latitude && bh.longitude ? <Badge variant="success">Set</Badge> : <Badge variant="secondary">Missing</Badge>}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
