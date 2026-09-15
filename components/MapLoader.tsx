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
    bottomLeft?: ReactNode;
    demo?: boolean;
};

export default function MapLoader({ userId, topRight, bottomLeft, demo }: MapLoaderProps) {
    return <Map userId={userId} topRight={topRight} bottomLeft={bottomLeft} demo={demo} />;
}
