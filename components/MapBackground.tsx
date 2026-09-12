'use client';

import { useEffect, useRef } from 'react';
import { MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { configureMaplibre } from '@/lib/maplibre';

const BACKGROUND_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export default function MapBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        configureMaplibre();

        const map = new MapLibreMap({
            container: containerRef.current,
            style: BACKGROUND_STYLE,
            center: [4.37586, 51.99625],
            zoom: 13,
            interactive: false,
            attributionControl: false,
        });

        return () => map.remove();
    }, []);

    return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
