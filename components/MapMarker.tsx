'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Marker, type MapLibreMap } from 'maplibre-gl';

type MapMarkerProps = {
    map: MapLibreMap;
    lat: number;
    lng: number;
    zIndex?: number;
    children: ReactNode;
};

export default function MapMarker({ map, lat, lng, zIndex = 0, children }: MapMarkerProps) {
    const [element] = useState(() => document.createElement('div'));
    const [marker, setMarker] = useState<Marker | null>(null);
    const initial = useRef({ lat, lng });

    useEffect(() => {
        const instance = new Marker({ element, anchor: 'bottom' })
            .setLngLat([initial.current.lng, initial.current.lat])
            .addTo(map);

        setMarker(instance);
        return () => {
            instance.remove();
            setMarker(null);
        };
    }, [map, element]);

    useEffect(() => {
        marker?.setLngLat([lng, lat]);
    }, [marker, lat, lng]);

    useEffect(() => {
        if (!marker) return;
        marker.getElement().style.zIndex = String(zIndex);
    }, [marker, zIndex]);

    return createPortal(children, element);
}
