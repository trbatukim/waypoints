'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchBox from './SearchBar';
import PinsLayer, { PIN_DRAG_DATA_TYPE, type Pin, type Opinion } from './PinsLayer';
import { createClient } from '@/lib/supabase/client';
import styles from './map.module.css';

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
    const [opinions, setOpinions] = useState<Record<string, Opinion>>({});
    const [prevUserId, setPrevUserId] = useState(userId);
    const supabase = createClient();

    if (userId !== prevUserId) {
        setPrevUserId(userId);
        setOpinions({});
    }

    useEffect(() => {
        supabase
            .from('places')
            .select('id, name, lat, lng, created_by')
            .then(({ data, error }) => {
                if (error) console.error('Failed to load places:', error);
                if (!error && data) setPins(data);
            });
    }, [supabase]);

    useEffect(() => {
        if (!userId) return;

        supabase
            .from('opinions')
            .select('place_id, rating, note')
            .eq('user_id', userId)
            .then(({ data, error }) => {
                if (error) console.error('Failed to load opinions:', error);
                if (!error && data) {
                    setOpinions(
                        Object.fromEntries(
                            data.map((o) => [o.place_id, { rating: o.rating / 2, note: o.note ?? '' }])
                        )
                    );
                }
            });
    }, [supabase, userId]);

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

    async function saveOpinion(placeId: string, rating: number, review: string) {
        if (!userId) return;

        const { error } = await supabase
            .from('opinions')
            .upsert(
                { place_id: placeId, rating: Math.round(rating * 2), note: review, user_id: userId },
                { onConflict: 'place_id,user_id' }
            );

        if (error) {
            console.error('Failed to save opinion:', error);
            return;
        }

        setOpinions((prev) => ({ ...prev, [placeId]: { rating, note: review } }));
    }

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
            <MapContainer
            center={[52.0116, 4.3571]} // Delft, change to whatever
            zoom={13}
            style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <PinsLayer
                pins={pins}
                opinions={opinions}
                onAddPin={addPin}
                onDeletePin={deletePin}
                onSaveOpinion={saveOpinion}
                />

                <SearchBox onSelectResult={addPin} />
            </MapContainer>

            {userId && (
                <div
                    className={styles.pinHandle}
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData(PIN_DRAG_DATA_TYPE, '1');
                        e.dataTransfer.effectAllowed = 'copy';
                    }}
                    title="Drag onto the map to add a pin"
                >
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 297 297"
                        fill="#171717"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M148.5,0C87.43,0,37.747,49.703,37.747,110.797c0,91.026,99.729,179.905,103.976,183.645 c1.936,1.705,4.356,2.559,6.777,2.559c2.421,0,4.841-0.853,6.778-2.559c4.245-3.739,103.975-92.618,103.975-183.645 C259.253,49.703,209.57,0,148.5,0z M148.5,79.693c16.964,0,30.765,13.953,30.765,31.104c0,17.151-13.801,31.104-30.765,31.104 c-16.964,0-30.765-13.953-30.765-31.104C117.735,93.646,131.536,79.693,148.5,79.693z" />
                    </svg>
                </div>
            )}
        </div>
    );
}