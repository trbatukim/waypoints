'use client';

import { useEffect, useMemo } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

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
    pins: Pin[];
    selectedPinId: string | null;
    draft: PinDraft | null;
    focus: MapFocus | null;
    onSelectPin: (id: string) => void;
    onDropPin: (lat: number, lng: number, name: string) => void;
};

export default function PinsLayer({
    pins,
    selectedPinId,
    draft,
    focus,
    onSelectPin,
    onDropPin,
}: PinsLayerProps) {
    const map = useMap();

    useEffect(() => {
        if (!focus) return;

        const zoom = focus.zoom ?? map.getZoom();
        const point = map.project([focus.lat, focus.lng], zoom);
        const offset = !focus.offsetForPanel
            ? L.point(0, 0)
            : map.getSize().x <= NARROW_VIEWPORT
              ? L.point(0, -SHEET_HEIGHT / 2)
              : L.point(PANEL_WIDTH / 2, 0);

        map.flyTo(map.unproject(point.subtract(offset), zoom), zoom);
    }, [map, focus]);

    const draftLat = draft?.lat;
    const draftLng = draft?.lng;
    const draftPosition = useMemo(
        () => (draftLat === undefined || draftLng === undefined ? null : L.latLng(draftLat, draftLng)),
        [draftLat, draftLng]
    );

    useEffect(() => {
        const container = map.getContainer();

        function handleDragOver(e: DragEvent) {
            if (!e.dataTransfer?.types.includes(PIN_DRAG_DATA_TYPE)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }

        function handleDrop(e: DragEvent) {
            if (!e.dataTransfer?.types.includes(PIN_DRAG_DATA_TYPE)) return;
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
            const { lat, lng } = map.containerPointToLatLng(point);
            onDropPin(lat, lng, '');
        }

        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        return () => {
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('drop', handleDrop);
        };
    }, [map, onDropPin]);

    return (
        <>
            {pins.map((pin) => (
                <Marker
                    key={pin.id}
                    position={[pin.lat, pin.lng]}
                    zIndexOffset={pin.id === selectedPinId ? 1000 : 0}
                    eventHandlers={{ click: () => onSelectPin(pin.id) }}
                />
            ))}

            {draftPosition && <Marker position={draftPosition} opacity={0.6} />}
        </>
    );
}
