'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { MapLibreMap, LngLat, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SearchBox from './SearchBar';
import PinGlyph from './PinGlyph';
import PinsLayer, { PIN_DRAG_DATA_TYPE, type Pin, type PinDraft, type MapFocus } from './PinsLayer';
import PlacePanel from './PlacePanel';
import DraftPanel from './DraftPanel';
import PlacesPanel, { type PlaceStats } from './PlacesPanel';
import type { Opinion, PlaceOpinion } from './Opinion';
import { createClient } from '@/lib/supabase/client';
import { LIBERTY_STYLE, configureMaplibre, styleOptionsFor } from '@/lib/maplibre';
import { useTheme } from '@/lib/useTheme';
import styles from './map.module.css';

const INITIAL_CENTER: [number, number] = [4.3571, 52.0116];
const INITIAL_ZOOM = 13;

type MapProps = {
    userId: string | null;
    topRight: ReactNode;
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

export default function Map({ userId, topRight }: MapProps) {
    const [pins, setPins] = useState<Pin[]>([]);
    const [opinions, setOpinions] = useState<Record<string, Opinion>>({});
    const [placeOpinions, setPlaceOpinions] = useState<Record<string, PlaceOpinion[]>>({});
    const [placeStats, setPlaceStats] = useState<Record<string, PlaceStats>>({});
    const [draft, setDraft] = useState<PinDraft | null>(null);
    const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
    const [focus, setFocus] = useState<MapFocus | null>(null);
    const [listOpen, setListOpen] = useState(false);
    const [prevUserId, setPrevUserId] = useState(userId);
    const [map, setMap] = useState<MapLibreMap | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const appliedThemeRef = useRef(theme);
    const supabase = createClient();

    useEffect(() => {
        if (!containerRef.current) return;

        configureMaplibre();

        const instance = new MapLibreMap({
            container: containerRef.current,
            center: INITIAL_CENTER,
            zoom: INITIAL_ZOOM,
            attributionControl: { compact: true },
        });

        instance.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');
        instance.setStyle(LIBERTY_STYLE, styleOptionsFor(appliedThemeRef.current));
        instance.on('load', () => setMap(instance));

        return () => {
            setMap(null);
            instance.remove();
        };
    }, []);

    useEffect(() => {
        if (!map || appliedThemeRef.current === theme) return;

        appliedThemeRef.current = theme;
        map.setStyle(LIBERTY_STYLE, styleOptionsFor(theme));
    }, [map, theme]);

    const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;

    const startDraft = useCallback((lat: number, lng: number, name: string, zoom?: number) => {
        setDraft({ lat, lng, name });
        setSelectedPinId(null);
        setListOpen(false);
        setFocus({ lat, lng, zoom, offsetForPanel: true });
    }, []);

    const updateDraft = useCallback((next: PinDraft) => setDraft(next), []);

    const selectPin = useCallback(
        (id: string) => {
            const pin = pins.find((p) => p.id === id);
            if (!pin) return;

            setSelectedPinId(id);
            setDraft(null);
            setListOpen(false);
            setFocus({ lat: pin.lat, lng: pin.lng, offsetForPanel: true });
        },
        [pins]
    );

    const closePanel = useCallback(() => setSelectedPinId(null), []);
    const cancelDraft = useCallback(() => setDraft(null), []);
    const closeList = useCallback(() => setListOpen(false), []);

    function toggleList() {
        if (listOpen) {
            setListOpen(false);
            return;
        }

        setSelectedPinId(null);
        setDraft(null);
        setListOpen(true);
        loadPlaceStats();
    }

    async function loadPlaceStats() {
        const { data, error } = await supabase.from('opinions').select('place_id, rating');

        if (error) {
            console.error('Failed to load place ratings:', error);
            return;
        }

        const totals: Record<string, { reviewCount: number; ratedCount: number; ratingSum: number }> = {};
        for (const o of data ?? []) {
            const entry = (totals[o.place_id] ??= { reviewCount: 0, ratedCount: 0, ratingSum: 0 });
            entry.reviewCount += 1;
            if (o.rating) {
                entry.ratedCount += 1;
                entry.ratingSum += o.rating / 2;
            }
        }

        setPlaceStats(
            Object.fromEntries(
                Object.entries(totals).map(([placeId, t]) => [
                    placeId,
                    { reviewCount: t.reviewCount, average: t.ratedCount > 0 ? t.ratingSum / t.ratedCount : null },
                ])
            )
        );
    }

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

    async function renamePin(id: string, name: string) {
        const { data, error } = await supabase
            .from('places')
            .update({ name })
            .eq('id', id)
            .select('id, name, lat, lng, created_by')
            .single();

        if (error) {
            console.error('Failed to rename pin:', error);
            return;
        }

        if (data) setPins((prev) => prev.map((pin) => (pin.id === id ? data : pin)));
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

    async function deleteOpinion(placeId: string) {
        if (!userId) return;

        const { data, error } = await supabase
            .from('opinions')
            .delete()
            .eq('place_id', placeId)
            .eq('user_id', userId)
            .select('id');

        if (error) {
            console.error('Failed to delete opinion:', error);
            return;
        }

        if (!data || data.length === 0) return;

        setOpinions((prev) => {
            const next = { ...prev };
            delete next[placeId];
            return next;
        });
        setPlaceOpinions((prev) => ({
            ...prev,
            [placeId]: (prev[placeId] ?? []).filter((o) => o.userId !== userId),
        }));
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

            <div className={styles.topBar}>
                <button
                    type="button"
                    className={styles.hamburgerButton}
                    aria-label="All places"
                    aria-expanded={listOpen}
                    onClick={toggleList}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M20 7L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M20 12L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M20 17L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
                <SearchBox onSelectResult={proposePin} />
                <div className={styles.topBarEnd}>{topRight}</div>
            </div>

            {listOpen && <PlacesPanel pins={pins} stats={placeStats} onSelectPin={selectPin} onClose={closeList} />}

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
                    onRenamePin={renamePin}
                    onSaveOpinion={saveOpinion}
                    onDeleteOpinion={deleteOpinion}
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
                    <PinGlyph />
                </div>
            )}
        </div>
    );
}