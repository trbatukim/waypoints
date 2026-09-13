import { setWorkerUrl, type StyleSwapOptions, type TransformStyleFunction } from 'maplibre-gl';
import { darkenStyle } from './darkLiberty';
import type { Theme } from './theme';

export const MAPLIBRE_WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';
export const LIBERTY_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const toDark: TransformStyleFunction = (_previous, next) => darkenStyle(next);

let configured = false;

export function configureMaplibre() {
    if (configured) return;
    configured = true;
    setWorkerUrl(MAPLIBRE_WORKER_URL);
}

export function styleOptionsFor(theme: Theme): StyleSwapOptions {
    return { transformStyle: theme === 'dark' ? toDark : undefined };
}
