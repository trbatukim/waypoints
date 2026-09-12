import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StarDisplay } from './Stars'

function clipWidths(container: HTMLElement) {
  return Array.from(container.querySelectorAll('rect')).map((rect) =>
    Number(rect.getAttribute('width'))
  )
}

describe('StarDisplay', () => {
  it('renders five stars', () => {
    const { container } = render(<StarDisplay idPrefix="p" value={0} label="0 out of 5 stars" />)
    expect(container.querySelectorAll('svg')).toHaveLength(5)
  })

  it('fills whole stars up to the rating and leaves the rest empty', () => {
    const { container } = render(<StarDisplay idPrefix="p" value={3} label="3 out of 5 stars" />)
    expect(clipWidths(container)).toEqual([24, 24, 24, 0, 0])
  })

  it('half-fills the fractional star', () => {
    const { container } = render(<StarDisplay idPrefix="p" value={3.5} label="3.5 out of 5 stars" />)
    expect(clipWidths(container)).toEqual([24, 24, 24, 12, 0])
  })

  it('clamps an average that is not on a half step', () => {
    const { container } = render(<StarDisplay idPrefix="p" value={4.25} label="4.25 out of 5 stars" />)
    expect(clipWidths(container)).toEqual([24, 24, 24, 24, 6])
  })

  it('gives each star a clip path that its fill actually references', () => {
    const { container } = render(<StarDisplay idPrefix="avg-abc" value={2} label="2 out of 5 stars" />)

    const ids = Array.from(container.querySelectorAll('clipPath')).map((c) => c.getAttribute('id'))
    expect(ids).toEqual([1, 2, 3, 4, 5].map((star) => `avg-abc-star-${star}`))
    expect(new Set(ids).size).toBe(5)

    for (const id of ids) {
      expect(container.querySelector(`path[clip-path="url(#${id})"]`)).not.toBeNull()
    }
  })
})
