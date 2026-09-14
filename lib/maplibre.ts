import { setWorkerUrl, type StyleSwapOptions, type TransformStyleFunction } from 'maplibre-gl';
import { DARK, LIGHT, recolorStyle } from './libertyPalette';
import type { Theme } from './theme';

export const MAPLIBRE_WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';
export const LIBERTY_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const toDark: TransformStyleFunction = (_previous, next) => recolorStyle(next, DARK);
const toLight: TransformStyleFunction = (_previous, next) => recolorStyle(next, LIGHT);

let configured = false;

export function configureMaplibre() {
    if (configured) return;
    configured = true;
    setWorkerUrl(MAPLIBRE_WORKER_URL);
}

export function styleOptionsFor(theme: Theme): StyleSwapOptions {
    return { transformStyle: theme === 'dark' ? toDark : toLight };
}
