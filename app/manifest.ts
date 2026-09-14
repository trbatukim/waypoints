import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Waypoints',
        short_name: 'Waypoints',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
            { src: '/icon/192', sizes: '192x192', type: 'image/png' },
            { src: '/icon/512', sizes: '512x512', type: 'image/png' },
            { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
