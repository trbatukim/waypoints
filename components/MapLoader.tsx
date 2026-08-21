'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <p>Loading map…</p>,
});

type MapLoaderProps = {
    userId: string | null;
};

export default function MapLoader({ userId }: MapLoaderProps) {
    return <Map userId={userId} />;
}
