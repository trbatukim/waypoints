'use client';

import { useEffect } from 'react';
import type { MapLibreMap } from 'maplibre-gl';
import styles from './map.module.css';
import MapMarker from './MapMarker';
import PinGlyph from './PinGlyph';

export const PIN_DRAG_DATA_TYPE = 'application/x-waypoints-new-pin';

const PANEL_WIDTH = 360;
const SHEET_HEIGHT = 320;
const NARROW_VIEWPORT = 640;

export type Pin = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    created_by: string;
};

export type PinDraft = {
    lat: number;
    lng: number;
    name: string;
};

export type MapFocus = {
    lat: number;
    lng: number;
    zoom?: number;
    offsetForPanel: boolean;
};

type PinsLayerProps = {
    map: MapLibreMap | null;
    pins: Pin[];
    selectedPinId: string | null;
    draft: PinDraft | null;
    focus: MapFocus | null;
    onSelectPin: (id: string) => void;
    onDropPin: (lat: number, lng: number, name: string) => void;
};

export default function PinsLayer({
    map,
    pins,
    selectedPinId,
    draft,
    focus,
    onSelectPin,
    onDropPin,
}: PinsLayerProps) {
    useEffect(() => {
        if (!map || !focus) return;

        const narrow = map.getCanvas().clientWidth <= NARROW_VIEWPORT;
        const offset: [number, number] = !focus.offsetForPanel
            ? [0, 0]
            : narrow
              ? [0, -SHEET_HEIGHT / 2]
              : [PANEL_WIDTH / 2, 0];

        map.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom, offset });
    }, [map, focus]);

    useEffect(() => {
        if (!map) return;

        const container = map.getContainer();

        function handleDragOver(e: DragEvent) {
            if (!e.dataTransfer?.types.includes(PIN_DRAG_DATA_TYPE)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }

        function handleDrop(e: DragEvent) {
            if (!map || !e.dataTransfer?.types.includes(PIN_DRAG_DATA_TYPE)) return;
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const { lat, lng } = map.unproject([e.clientX - rect.left, e.clientY - rect.top]);
            onDropPin(lat, lng, '');
        }

        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        return () => {
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('drop', handleDrop);
        };
    }, [map, onDropPin]);

    if (!map) return null;

    return (
        <>
            {pins.map((pin) => (
                <MapMarker
                    key={pin.id}
                    map={map}
                    lat={pin.lat}
                    lng={pin.lng}
                    zIndex={pin.id === selectedPinId ? 2 : 1}
                >
                    <button
                        type="button"
                        className={styles.pinButton}
                        aria-label={pin.name}
                        onClick={() => onSelectPin(pin.id)}
                    >
                        <PinGlyph selected={pin.id === selectedPinId} />
                    </button>
                </MapMarker>
            ))}

            {draft && (
                <MapMarker map={map} lat={draft.lat} lng={draft.lng} zIndex={3}>
                    <span className={styles.pinDraft}>
                        <PinGlyph selected />
                    </span>
                </MapMarker>
            )}
        </>
    );
}
