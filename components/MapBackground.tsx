'use client';

import { useEffect, useRef } from 'react';
import { MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LIBERTY_STYLE, configureMaplibre, styleOptionsFor } from '@/lib/maplibre';

export default function MapBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        configureMaplibre();

        const map = new MapLibreMap({
            container: containerRef.current,
            center: [4.37586, 51.99625],
            zoom: 13,
            interactive: false,
            attributionControl: false,
        });

        map.setStyle(LIBERTY_STYLE, styleOptionsFor('dark'));

        return () => map.remove();
    }, []);

    return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
