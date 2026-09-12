'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapLibreMap, LngLat, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SearchBox from './SearchBar';
import PinsLayer, { PIN_DRAG_DATA_TYPE, type Pin, type PinDraft, type MapFocus } from './PinsLayer';
import PlacePanel from './PlacePanel';
import DraftPanel from './DraftPanel';
import type { Opinion, PlaceOpinion } from './Opinion';
import { createClient } from '@/lib/supabase/client';
import { configureMaplibre } from '@/lib/maplibre';
import styles from './map.module.css';

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const INITIAL_CENTER: [number, number] = [4.3571, 52.0116];
const INITIAL_ZOOM = 13;

type MapProps = {
    userId: string | null;
};

const EXISTING_PIN_RADIUS_METERS = 50;
const SEARCH_ZOOM = 15;

type ProfileRef = { name: string | null } | { name: string | null }[] | null;

type OpinionRow = {
    id: string;
    user_id: string;
    rating: number | null;
    note: string | null;
    profiles: ProfileRef;
};

function profileName(profiles: ProfileRef) {
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return profile?.name?.trim() || 'Someone';
}

export default function Map({ userId }: MapProps) {
    const [pins, setPins] = useState<Pin[]>([]);
    const [opinions, setOpinions] = useState<Record<string, Opinion>>({});
    const [placeOpinions, setPlaceOpinions] = useState<Record<string, PlaceOpinion[]>>({});
    const [draft, setDraft] = useState<PinDraft | null>(null);
    const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
    const [focus, setFocus] = useState<MapFocus | null>(null);
    const [prevUserId, setPrevUserId] = useState(userId);
    const [map, setMap] = useState<MapLibreMap | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!containerRef.current) return;

        configureMaplibre();

        const instance = new MapLibreMap({
            container: containerRef.current,
            style: MAP_STYLE,
            center: INITIAL_CENTER,
            zoom: INITIAL_ZOOM,
            attributionControl: { compact: true },
        });

        instance.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');
        instance.on('load', () => setMap(instance));

        return () => {
            setMap(null);
            instance.remove();
        };
    }, []);

    const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;

    const startDraft = useCallback((lat: number, lng: number, name: string, zoom?: number) => {
        setDraft({ lat, lng, name });
        setSelectedPinId(null);
        setFocus({ lat, lng, zoom, offsetForPanel: true });
    }, []);

    const updateDraft = useCallback((next: PinDraft) => setDraft(next), []);

    const selectPin = useCallback(
        (id: string) => {
            const pin = pins.find((p) => p.id === id);
            if (!pin) return;

            setSelectedPinId(id);
            setDraft(null);
            setFocus({ lat: pin.lat, lng: pin.lng, offsetForPanel: true });
        },
        [pins]
    );

    const closePanel = useCallback(() => setSelectedPinId(null), []);
    const cancelDraft = useCallback(() => setDraft(null), []);

    if (userId !== prevUserId) {
        setPrevUserId(userId);
        setOpinions({});
        setPlaceOpinions({});
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

    const loadPlaceOpinions = useCallback(
        async (placeId: string) => {
            const { data, error } = await supabase
                .from('opinions')
                .select('id, user_id, rating, note, profiles(name)')
                .eq('place_id', placeId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to load opinions for place:', error);
                return;
            }

            setPlaceOpinions((prev) => ({
                ...prev,
                [placeId]: ((data ?? []) as OpinionRow[]).map((o) => ({
                    id: o.id,
                    userId: o.user_id,
                    authorName: profileName(o.profiles),
                    rating: (o.rating ?? 0) / 2,
                    note: o.note?.trim() ?? '',
                })),
            }));
        },
        [supabase]
    );

    function pinNear(lat: number, lng: number) {
        const target = new LngLat(lng, lat);
        return pins.find(
            (pin) => target.distanceTo(new LngLat(pin.lng, pin.lat)) <= EXISTING_PIN_RADIUS_METERS
        );
    }

    function proposePin(lat: number, lng: number, name: string) {
        if (!userId || pinNear(lat, lng)) {
            setDraft(null);
            setFocus({ lat, lng, zoom: SEARCH_ZOOM, offsetForPanel: false });
            return;
        }

        startDraft(lat, lng, name, SEARCH_ZOOM);
    }

    function addDraftPin() {
        if (!draft || draft.name.trim().length === 0) return;
        addPin(draft.lat, draft.lng, draft.name.trim());
        setDraft(null);
    }

    async function addPin(lat: number, lng: number, name: string) {
        if (!userId) return;

        const { data, error } = await supabase
            .from('places')
            .insert({ lat, lng, name, created_by: userId })
            .select('id, name, lat, lng, created_by')
            .single();

        if (error) {
            console.error('Failed to add pin:', error);
            return;
        }

        if (data) setPins((prev) => [...prev, data]);
    }

    async function deletePin(id: string) {
        const { data, error } = await supabase
            .from('places')
            .delete()
            .eq('id', id)
            .select('id');
        if (!error && data && data.length > 0) {
            setPins((prev) => prev.filter((pin) => pin.id !== id));
            setSelectedPinId((prev) => (prev === id ? null : prev));
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
        loadPlaceOpinions(placeId);
    }

    return (
        <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
            <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />

            <PinsLayer
                map={map}
                pins={pins}
                selectedPinId={selectedPinId}
                draft={draft}
                focus={focus}
                onSelectPin={selectPin}
                onDropPin={startDraft}
            />

            <SearchBox onSelectResult={proposePin} />

            {draft && (
                <DraftPanel
                    draft={draft}
                    onChange={updateDraft}
                    onAdd={addDraftPin}
                    onCancel={cancelDraft}
                />
            )}

            {selectedPin && (
                <PlacePanel
                    key={selectedPin.id}
                    pin={selectedPin}
                    userId={userId}
                    opinion={opinions[selectedPin.id]}
                    placeOpinions={placeOpinions[selectedPin.id]}
                    onClose={closePanel}
                    onDeletePin={deletePin}
                    onSaveOpinion={saveOpinion}
                    onLoadOpinions={loadPlaceOpinions}
                />
            )}

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