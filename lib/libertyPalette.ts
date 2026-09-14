import type { TransformStyleFunction } from 'maplibre-gl';

type StyleSpecification = Parameters<TransformStyleFunction>[1];
type LayerSpecification = StyleSpecification['layers'][number];

export type Hsla = { h: number; s: number; l: number; a: number };

type Tone = (color: Hsla) => Hsla;

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

const isGreen = (c: Hsla) => c.h >= 70 && c.h <= 170;

export const TONES = {
    ground: tone((c) => ({ s: c.s * (isGreen(c) ? 0.4 : 0.12), l: 0.09 + (1 - c.l) * 0.45 })),
    water: tone((c) => ({ s: c.s * 0.35, l: 0.065 })),
    waterLine: tone((c) => ({ s: c.s * 0.35, l: 0.2 })),
    line: tone((c) => ({ s: c.s * 0.3, l: 0.16 + c.l * 0.2 + c.s * 0.08 })),
    casing: tone((c) => ({ s: c.s * 0.4, l: 0.05 + c.l * 0.05 })),
    extrusion: tone((c) => ({ s: c.s * 0.5, l: 0.16 + (1 - c.l) * 0.1 })),
    text: tone((c) => ({ s: c.s * 0.5, l: 0.92 - c.l * 0.6 })),
    halo: tone((c) => ({ s: c.s * 0.2, l: 0.1 + (1 - c.l) * 0.1 })),
} satisfies Record<string, Tone>;

function toneFor(property: string, layerId: string): Tone {
    const id = layerId.toLowerCase();

    switch (property) {
        case 'fill-color':
            return id.includes('water') ? TONES.water : TONES.ground;
        case 'line-color':
            if (id.includes('casing')) return TONES.casing;
            if (id.includes('water')) return TONES.waterLine;
            if (id.includes('outline')) return TONES.ground;
            return TONES.line;
        case 'fill-extrusion-color':
            return TONES.extrusion;
        case 'text-color':
            return TONES.text;
        case 'text-halo-color':
            return TONES.halo;
        default:
            return TONES.ground;
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

function darkenLayer(layer: LayerSpecification): LayerSpecification {
    if (layer.type === 'raster') {
        return {
            ...layer,
            paint: { ...layer.paint, 'raster-brightness-max': 0.35, 'raster-saturation': -0.6 },
        };
    }

    if (!('paint' in layer) || !layer.paint) return layer;

    const paint = Object.fromEntries(
        Object.entries(layer.paint).map(([property, value]) => [
            property,
            property.endsWith('-color') ? recolor(value, toneFor(property, layer.id)) : value,
        ])
    );

    return { ...layer, paint } as LayerSpecification;
}

export function darkenStyle(style: StyleSpecification): StyleSpecification {
    return { ...style, layers: style.layers.map(darkenLayer) };
}
