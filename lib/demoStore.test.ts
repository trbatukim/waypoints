import { describe, it, expect } from 'vitest'
import { DEMO_USER_ID, createDemoStore } from './demoStore'

describe('createDemoStore', () => {
  it('starts with sample places and no reviews from the demo user', async () => {
    const store = createDemoStore()
    expect((await store.loadPins())?.length).toBeGreaterThan(0)
    expect(await store.loadOwnOpinions(DEMO_USER_ID)).toEqual({})
  })

  it('adds, renames and deletes pins', async () => {
    const store = createDemoStore()
    const pin = await store.addPin(52, 4.3, 'Market', DEMO_USER_ID)
    expect(pin).toMatchObject({ name: 'Market', created_by: DEMO_USER_ID })

    expect(await store.renamePin(pin!.id, 'Square')).toMatchObject({ id: pin!.id, name: 'Square' })
    expect(await store.deletePin(pin!.id)).toBe(true)
    expect(await store.deletePin(pin!.id)).toBe(false)
    expect((await store.loadPins())?.some((p) => p.id === pin!.id)).toBe(false)
  })

  it('upserts and deletes the demo user review', async () => {
    const store = createDemoStore()
    const [place] = (await store.loadPins())!
    const before = (await store.loadPlaceOpinions(place.id))!.length

    await store.saveOpinion(place.id, DEMO_USER_ID, 3, 'ok')
    await store.saveOpinion(place.id, DEMO_USER_ID, 4.5, 'better')

    const reviews = (await store.loadPlaceOpinions(place.id))!
    expect(reviews).toHaveLength(before + 1)
    expect(reviews.at(-1)).toMatchObject({ userId: DEMO_USER_ID, rating: 4.5, note: 'better' })
    expect(await store.loadOwnOpinions(DEMO_USER_ID)).toEqual({ [place.id]: { rating: 4.5, note: 'better' } })

    expect(await store.deleteOpinion(place.id, DEMO_USER_ID)).toBe(true)
    expect(await store.loadPlaceOpinions(place.id)).toHaveLength(before)
  })

  it('does not share state between instances', async () => {
    const first = createDemoStore()
    const [place] = (await first.loadPins())!
    await first.deletePin(place.id)

    const second = createDemoStore()
    expect((await second.loadPins())?.some((p) => p.id === place.id)).toBe(true)
  })

  it('summarizes ratings for the places list', async () => {
    const store = createDemoStore()
    const stats = (await store.loadPlaceStats())!
    expect(stats['demo-nieuwe-kerk']).toEqual({ reviewCount: 2, average: 4.5 })
  })
})
