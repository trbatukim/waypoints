'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <p>Loading map…</p>,
});

type MapLoaderProps = {
    userId: string | null;
    topRight: ReactNode;
};

export default function MapLoader({ userId, topRight }: MapLoaderProps) {
    return <Map userId={userId} topRight={topRight} />;
}
