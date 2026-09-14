import { describe, it, expect } from 'vitest'
import { DARK, LIGHT, formatColor, parseColor, recolorStyle, type Hsla, type Palette } from './libertyPalette'

type Style = Parameters<typeof recolorStyle>[0]

function color(value: unknown) {
  const parsed = parseColor(String(value))
  if (!parsed) throw new Error(`not a colour: ${String(value)}`)
  return parsed
}

const lightness = (value: unknown) => color(value).l

function style(layers: unknown[]): Style {
  return { version: 8, sources: {}, layers } as Style
}

describe('parseColor', () => {
  it.each([
    ['#fff', { l: 1, a: 1 }],
    ['#fc8', { a: 1 }],
    ['#f8f4f0', { a: 1 }],
    ['rgb(158,189,255)', { a: 1 }],
    ['rgb(27 ,27 ,29)', { a: 1 }],
    ['rgba(255,255,255,0.7)', { l: 1, a: 0.7 }],
    ['hsl(35,8%,85%)', { h: 35, s: 0.08, l: 0.85, a: 1 }],
    ['hsla(0,3%,85%,0.84)', { h: 0, s: 0.03, l: 0.85, a: 0.84 }],
  ])('parses %s', (input, expected) => {
    expect(parseColor(input)).toMatchObject(expected as Partial<Hsla>)
  })

  it.each(['match', 'render_height', 'Noto Sans Regular', ''])('ignores non-colour string %j', (input) => {
    expect(parseColor(input)).toBeNull()
  })

  it('round-trips through formatColor', () => {
    const parsed = parseColor('hsla(26,87%,62%,0.5)')!
    expect(parseColor(formatColor(parsed))).toMatchObject({ h: 26, s: 0.87, l: 0.62, a: 0.5 })
  })
})

const liberty = style([
  { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
  { id: 'water', type: 'fill', paint: { 'fill-color': 'rgb(158,189,255)' } },
  { id: 'park', type: 'fill', paint: { 'fill-color': '#d8e8c8' } },
  { id: 'building', type: 'fill', paint: { 'fill-color': 'hsl(35,8%,85%)' } },
  { id: 'road_minor', type: 'line', paint: { 'line-color': '#fff' } },
  { id: 'road_minor_casing', type: 'line', paint: { 'line-color': '#cfcdca' } },
  { id: 'road_secondary_tertiary', type: 'line', paint: { 'line-color': '#fea' } },
  { id: 'road_trunk_primary', type: 'line', paint: { 'line-color': '#fea' } },
  { id: 'road_motorway', type: 'line', paint: { 'line-color': ['interpolate', ['linear'], ['zoom'], 5, 'hsl(26,87%,62%)', 6, '#fc8'] } },
  { id: 'building-3d', type: 'fill-extrusion', paint: { 'fill-extrusion-color': 'hsl(35,8%,85%)', 'fill-extrusion-height': ['get', 'render_height'] } },
  { id: 'label_city', type: 'symbol', paint: { 'text-color': '#000', 'text-halo-color': '#fff' } },
  { id: 'natural_earth', type: 'raster', paint: { 'raster-opacity': 0.6 } },
])

function painter(palette: Palette) {
  const recolored = recolorStyle(liberty, palette)
  return (id: string) => (recolored.layers.find((layer) => layer.id === id) as { paint: Record<string, unknown> }).paint
}

describe('recolorStyle with DARK', () => {
  const paint = painter(DARK)
  const background = lightness(paint('background')['background-color'])

  it('makes the ground dark', () => {
    expect(background).toBeLessThan(0.2)
  })

  it('keeps water darker than the land around it', () => {
    expect(lightness(paint('water')['fill-color'])).toBeLessThan(background)
  })

  it('draws roads lighter than the ground and casings darker than their road', () => {
    const road = lightness(paint('road_minor')['line-color'])
    expect(road).toBeGreaterThan(background)
    expect(lightness(paint('road_minor_casing')['line-color'])).toBeLessThan(road)
  })

  it('recolours colours nested inside expressions and leaves the rest of the expression intact', () => {
    const [op, interpolation, input, stop1, from, stop2, to] = paint('road_motorway')['line-color'] as unknown[]
    expect([op, interpolation, input, stop1, stop2]).toEqual(['interpolate', ['linear'], ['zoom'], 5, 6])
    expect(lightness(from)).toBeLessThan(0.5)
    expect(lightness(to)).toBeLessThan(0.5)
  })

  it('keeps 3D building walls just above the ground and leaves their height alone', () => {
    expect(lightness(paint('building-3d')['fill-extrusion-color'])).toBeGreaterThan(background)
    expect(paint('building-3d')['fill-extrusion-height']).toEqual(['get', 'render_height'])
  })

  it('flips labels to light text on a dark halo', () => {
    expect(lightness(paint('label_city')['text-color'])).toBeGreaterThan(0.8)
    expect(lightness(paint('label_city')['text-halo-color'])).toBeLessThan(0.2)
  })

  it('dims the world relief raster', () => {
    expect(paint('natural_earth')).toMatchObject({ 'raster-opacity': 0.6, 'raster-brightness-max': 0.35 })
  })

  it('preserves transparency', () => {
    expect(DARK.tones.halo(parseColor('rgba(255,255,255,0.7)')!).a).toBe(0.7)
  })

  it('does not mutate the style it is given', () => {
    expect((liberty.layers[0] as { paint: Record<string, unknown> }).paint['background-color']).toBe('#f8f4f0')
  })
})

describe('recolorStyle with LIGHT', () => {
  const paint = painter(LIGHT)
  const background = lightness(paint('background')['background-color'])

  it('keeps the ground light', () => {
    expect(background).toBeGreaterThan(0.9)
  })

  it('tints water sky blue and parks mint', () => {
    expect(color(paint('water')['fill-color']).h).toBeCloseTo(200)
    expect(color(paint('park')['fill-color']).h).toBeCloseTo(145)
  })

  it('draws buildings just darker than the ground', () => {
    const building = lightness(paint('building')['fill-color'])
    expect(building).toBeLessThan(background)
    expect(building).toBeGreaterThan(0.85)
  })

  it('keeps minor and secondary roads white and draws highways in darker slate', () => {
    expect(lightness(paint('road_minor')['line-color'])).toBeGreaterThan(0.95)
    expect(lightness(paint('road_secondary_tertiary')['line-color'])).toBeGreaterThan(0.95)
    expect(lightness(paint('road_trunk_primary')['line-color'])).toBeLessThan(0.75)
    expect(lightness(paint('road_minor_casing')['line-color'])).toBeLessThan(lightness(paint('road_minor')['line-color']))
  })

  it('uses dark labels on a white halo', () => {
    expect(lightness(paint('label_city')['text-color'])).toBeLessThan(0.3)
    expect(lightness(paint('label_city')['text-halo-color'])).toBe(1)
  })

  it('leaves the world relief raster alone', () => {
    expect(paint('natural_earth')).toEqual({ 'raster-opacity': 0.6 })
  })
})
