'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchBox from './SearchBar';
import PinsLayer, { type Pin } from './PinsLayer';
import { createClient } from '@/lib/supabase/client';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MapProps = {
    userId: string | null;
};

export default function Map({ userId }: MapProps) {
    const [pins, setPins] = useState<Pin[]>([]);
    const supabase = createClient();

    useEffect(() => {
        supabase
            .from('places')
            .select('id, name, lat, lng, created_by')
            .then(({ data, error }) => {
                if (!error && data) setPins(data);
            });
    }, [supabase]);

    async function addPin(lat: number, lng: number, name: string) {
        if (!userId) return;

        const { data, error } = await supabase
            .from('places')
            .insert({ lat, lng, name, created_by: userId })
            .select('id, name, lat, lng, created_by')
            .single();
        
        if (!error && data) setPins((prev) => [...prev, data]);
    }

    async function deletePin(id: string) {
        const { data, error } = await supabase
            .from('places')
            .delete()
            .eq('id', id)
            .select('id');
        if (!error && data && data.length > 0) {
            setPins((prev) => prev.filter((pin) => pin.id !== id));
        }
    }

    return (
        <MapContainer
        center={[52.0116, 4.3571]} // Delft, change to whatever
        zoom={13}
        style={{ height: '100vh', width: '100%' }}
        >
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <PinsLayer pins={pins} onAddPin={addPin} onDeletePin={deletePin} />

            <SearchBox onSelectResult={addPin} />
        </MapContainer>
    );
}