import { setWorkerUrl } from 'maplibre-gl';

export const MAPLIBRE_WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';

let configured = false;

export function configureMaplibre() {
    if (configured) return;
    configured = true;
    setWorkerUrl(MAPLIBRE_WORKER_URL);
}
