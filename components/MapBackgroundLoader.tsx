'use client';

import dynamic from 'next/dynamic';

const MapBackground = dynamic(() => import('@/components/MapBackground'), {
    ssr: false,
});

export default function MapBackgroundLoader() {
    return <MapBackground />;
}
