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
import { createSupabaseStore } from '@/lib/placesStore';
import { createDemoStore } from '@/lib/demoStore';
import { LIBERTY_STYLE, configureMaplibre, styleOptionsFor } from '@/lib/maplibre';
import { useTheme } from '@/lib/useTheme';
import styles from './map.module.css';

const INITIAL_CENTER: [number, number] = [4.3571, 52.0116];
const INITIAL_ZOOM = 13;

type MapProps = {
    userId: string | null;
    topRight: ReactNode;
    bottomLeft?: ReactNode;
    demo?: boolean;
};

const EXISTING_PIN_RADIUS_METERS = 50;
const SEARCH_ZOOM = 15;

export default function Map({ userId, topRight, bottomLeft, demo = false }: MapProps) {
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
    const [store] = useState(() => (demo ? createDemoStore() : createSupabaseStore(createClient())));

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
        const stats = await store.loadPlaceStats();
        if (stats) setPlaceStats(stats);
    }

    if (userId !== prevUserId) {
        setPrevUserId(userId);
        setOpinions({});
        setPlaceOpinions({});
    }

    useEffect(() => {
        store.loadPins().then((data) => {
            if (data) setPins(data);
        });
    }, [store]);

    useEffect(() => {
        if (!userId) return;

        store.loadOwnOpinions(userId).then((data) => {
            if (data) setOpinions(data);
        });
    }, [store, userId]);

    const loadPlaceOpinions = useCallback(
        async (placeId: string) => {
            const data = await store.loadPlaceOpinions(placeId);
            if (data) setPlaceOpinions((prev) => ({ ...prev, [placeId]: data }));
        },
        [store]
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

        const data = await store.addPin(lat, lng, name, userId);
        if (data) setPins((prev) => [...prev, data]);
    }

    async function deletePin(id: string) {
        if (await store.deletePin(id)) {
            setPins((prev) => prev.filter((pin) => pin.id !== id));
            setSelectedPinId((prev) => (prev === id ? null : prev));
        }
    }

    async function renamePin(id: string, name: string) {
        const data = await store.renamePin(id, name);
        if (data) setPins((prev) => prev.map((pin) => (pin.id === id ? data : pin)));
    }

    async function saveOpinion(placeId: string, rating: number, review: string) {
        if (!userId) return;
        if (!(await store.saveOpinion(placeId, userId, rating, review))) return;

        setOpinions((prev) => ({ ...prev, [placeId]: { rating, note: review } }));
        loadPlaceOpinions(placeId);
    }

    async function deleteOpinion(placeId: string) {
        if (!userId) return;
        if (!(await store.deleteOpinion(placeId, userId))) return;

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

            {bottomLeft && <div className={styles.bottomLeft}>{bottomLeft}</div>}

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