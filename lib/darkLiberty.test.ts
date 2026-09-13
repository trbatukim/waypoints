import { describe, it, expect } from 'vitest'
import { darkenStyle, formatColor, parseColor, TONES, type Hsla } from './darkLiberty'

type Style = Parameters<typeof darkenStyle>[0]

function lightness(value: unknown) {
  const color = parseColor(String(value))
  if (!color) throw new Error(`not a colour: ${String(value)}`)
  return color.l
}

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
    const color = parseColor('hsla(26,87%,62%,0.5)')!
    expect(parseColor(formatColor(color))).toMatchObject({ h: 26, s: 0.87, l: 0.62, a: 0.5 })
  })
})

describe('darkenStyle', () => {
  const liberty = style([
    { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
    { id: 'water', type: 'fill', paint: { 'fill-color': 'rgb(158,189,255)' } },
    { id: 'park', type: 'fill', paint: { 'fill-color': '#d8e8c8' } },
    { id: 'road_minor', type: 'line', paint: { 'line-color': '#fff' } },
    { id: 'road_minor_casing', type: 'line', paint: { 'line-color': '#cfcdca' } },
    { id: 'road_motorway', type: 'line', paint: { 'line-color': ['interpolate', ['linear'], ['zoom'], 5, 'hsl(26,87%,62%)', 6, '#fc8'] } },
    { id: 'building-3d', type: 'fill-extrusion', paint: { 'fill-extrusion-color': 'hsl(35,8%,85%)', 'fill-extrusion-height': ['get', 'render_height'] } },
    { id: 'label_city', type: 'symbol', paint: { 'text-color': '#000', 'text-halo-color': '#fff' } },
    { id: 'natural_earth', type: 'raster', paint: { 'raster-opacity': 0.6 } },
  ])

  const dark = darkenStyle(liberty)
  const paint = (id: string) => (dark.layers.find((layer) => layer.id === id) as { paint: Record<string, unknown> }).paint

  const background = lightness(paint('background')['background-color'])

  it('makes the ground dark', () => {
    expect(background).toBeLessThan(0.15)
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
    expect(TONES.halo(parseColor('rgba(255,255,255,0.7)')!).a).toBe(0.7)
  })

  it('does not mutate the style it is given', () => {
    expect((liberty.layers[0] as { paint: Record<string, unknown> }).paint['background-color']).toBe('#f8f4f0')
  })
})
