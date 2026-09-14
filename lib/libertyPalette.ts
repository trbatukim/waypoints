import type { TransformStyleFunction } from 'maplibre-gl';

type StyleSpecification = Parameters<TransformStyleFunction>[1];
type LayerSpecification = StyleSpecification['layers'][number];

export type Hsla = { h: number; s: number; l: number; a: number };

type Tone = (color: Hsla) => Hsla;

type ToneName = 'ground' | 'water' | 'line' | 'highway' | 'casing' | 'highwayCasing' | 'building' | 'text' | 'halo';

export type Palette = { tones: Record<ToneName, Tone>; raster: Record<string, number> };

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTIONAL = /^(rgba?|hsla?)\(([^)]*)\)$/i;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function rgbToHsla(r: number, g: number, b: number, a: number): Hsla {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;

    if (d === 0) return { h: 0, s: 0, l, a };

    const s = d / (1 - Math.abs(2 * l - 1));
    const h =
        max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;

    return { h, s, l, a };
}

export function parseColor(value: string): Hsla | null {
    const text = value.trim();

    const hex = HEX.exec(text);
    if (hex) {
        let digits = hex[1];
        if (digits.length <= 4) digits = [...digits].map((d) => d + d).join('');
        const channel = (i: number) => parseInt(digits.slice(i, i + 2), 16) / 255;
        return rgbToHsla(channel(0), channel(2), channel(4), digits.length === 8 ? channel(6) : 1);
    }

    const functional = FUNCTIONAL.exec(text);
    if (!functional) return null;

    const parts = functional[2].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;

    const number = (part: string) => parseFloat(part);
    const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? number(parts[3]) / 100 : number(parts[3]);

    if (functional[1].toLowerCase().startsWith('rgb')) {
        return rgbToHsla(number(parts[0]) / 255, number(parts[1]) / 255, number(parts[2]) / 255, alpha);
    }

    return { h: number(parts[0]), s: number(parts[1]) / 100, l: number(parts[2]) / 100, a: alpha };
}

export function formatColor({ h, s, l, a }: Hsla) {
    const round = (value: number, digits = 1) => Number(value.toFixed(digits));
    return `hsla(${round(h)}, ${round(clamp01(s) * 100)}%, ${round(clamp01(l) * 100)}%, ${round(clamp01(a), 3)})`;
}

const tone = (map: (c: Hsla) => Partial<Hsla>): Tone => (c) => ({ ...c, ...map(c) });

const NAVY = 222;
const TEAL = 170;
const SLATE = 218;
const MINT = 145;
const SKY = 200;

const isGreen = (c: Hsla) => c.h >= 70 && c.h <= 170;
const isBlue = (c: Hsla) => c.h >= 190 && c.h <= 250 && c.s > 0.2;
const isPink = (c: Hsla) => c.h >= 300 && c.s > 0.5;

const darkLine = tone((c) => ({ h: NAVY, s: 0.22 + c.s * 0.1, l: 0.26 + c.l * 0.06 + c.s * 0.1 }));
const darkCasing = tone((c) => ({ h: NAVY, s: 0.25, l: 0.1 + c.l * 0.04 }));

export const DARK: Palette = {
    tones: {
        ground: tone((c) =>
            isGreen(c)
                ? { h: TEAL, s: 0.35, l: 0.14 + (1 - c.l) * 0.15 }
                : { h: NAVY, s: 0.22, l: 0.16 + (1 - c.l) * 0.25 }
        ),
        water: tone(() => ({ h: NAVY, s: 0.3, l: 0.07 })),
        line: darkLine,
        highway: darkLine,
        casing: darkCasing,
        highwayCasing: darkCasing,
        building: tone((c) => ({ h: NAVY, s: 0.2, l: 0.2 + (1 - c.l) * 0.1 })),
        text: tone((c) =>
            isBlue(c) ? { s: 0.55, l: 0.88 - c.l * 0.35 } : { h: NAVY, s: 0.12, l: 0.88 - c.l * 0.35 }
        ),
        halo: tone(() => ({ h: NAVY, s: 0.25, l: 0.12 })),
    },
    raster: { 'raster-brightness-max': 0.35, 'raster-saturation': -0.6 },
};

export const LIGHT: Palette = {
    tones: {
        ground: tone((c) => {
            if (isGreen(c)) return { h: MINT, s: 0.5, l: 0.87 + (c.l - 0.8) * 0.2 };
            if (isPink(c)) return { h: 355, s: 0.65, l: 0.94 };
            return { h: SLATE, s: 0.2, l: 0.94 + c.l * 0.02 };
        }),
        water: tone(() => ({ h: SKY, s: 0.8, l: 0.78 })),
        line: tone((c) => ({ h: SLATE, s: 0.12, l: c.s > 0.5 ? 1 : 1 - (1 - c.l) * 0.9 })),
        highway: tone(() => ({ h: SLATE, s: 0.22, l: 0.66 })),
        casing: tone(() => ({ h: SLATE, s: 0.12, l: 0.85 })),
        highwayCasing: tone(() => ({ h: SLATE, s: 0.2, l: 0.56 })),
        building: tone(() => ({ h: SLATE, s: 0.08, l: 0.86 })),
        text: tone((c) => (isBlue(c) ? { h: 208, s: 0.55, l: 0.5 } : { h: SLATE, s: 0.06, l: 0.15 + c.l * 0.6 })),
        halo: tone(() => ({ h: 0, s: 0, l: 1 })),
    },
    raster: {},
};

function toneFor(property: string, layerId: string): ToneName {
    const id = layerId.toLowerCase();
    const major = id.includes('motorway') || id.includes('trunk');

    switch (property) {
        case 'fill-color':
            if (id.includes('water')) return 'water';
            if (id.includes('building')) return 'building';
            return 'ground';
        case 'line-color':
            if (id.includes('casing')) return major ? 'highwayCasing' : 'casing';
            if (id.includes('water')) return 'water';
            if (id.includes('outline')) return 'ground';
            return major ? 'highway' : 'line';
        case 'fill-extrusion-color':
            return 'building';
        case 'text-color':
            return 'text';
        case 'text-halo-color':
            return 'halo';
        default:
            return 'ground';
    }
}

function recolor(value: unknown, apply: Tone): unknown {
    if (typeof value === 'string') {
        const color = parseColor(value);
        return color ? formatColor(apply(color)) : value;
    }
    if (Array.isArray(value)) return value.map((item) => recolor(item, apply));
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, recolor(item, apply)]));
    }
    return value;
}

function recolorLayer(layer: LayerSpecification, palette: Palette): LayerSpecification {
    if (layer.type === 'raster') {
        return { ...layer, paint: { ...layer.paint, ...palette.raster } };
    }

    if (!('paint' in layer) || !layer.paint) return layer;

    const paint = Object.fromEntries(
        Object.entries(layer.paint).map(([property, value]) => [
            property,
            property.endsWith('-color') ? recolor(value, palette.tones[toneFor(property, layer.id)]) : value,
        ])
    );

    return { ...layer, paint } as LayerSpecification;
}

export function recolorStyle(style: StyleSpecification, palette: Palette): StyleSpecification {
    return { ...style, layers: style.layers.map((layer) => recolorLayer(layer, palette)) };
}
