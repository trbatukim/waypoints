import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const WORKER_FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'));
const out = join(process.cwd(), 'public', 'maplibre');

await mkdir(out, { recursive: true });

for (const file of WORKER_FILES) {
    await copyFile(join(dist, file), join(out, file));
}

console.log(`Copied ${WORKER_FILES.length} maplibre worker files to public/maplibre/`);
