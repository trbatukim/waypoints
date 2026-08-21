import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login } from './actions'
import { createClient } from '@/lib/supabase/server'
import { mockSupabaseClient, formData } from '@/lib/supabase/testing'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to home on success', async () => {
    const supabase = mockSupabaseClient({ authError: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await expect(login(formData({ email: 'a@b.com', password: 'secret' })))
      .rejects.toThrow('REDIRECT:/')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
    })
  })

  it('redirects back to /login with the error message on failure', async () => {
    const supabase = mockSupabaseClient({ authError: { message: 'Invalid credentials' } })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await expect(login(formData({ email: 'a@b.com', password: 'wrong' })))
      .rejects.toThrow('REDIRECT:/login?error=Invalid%20credentials')
  })

  it('passes rememberMe through to createClient', async () => {
    const supabase = mockSupabaseClient({ authError: null })
    vi.mocked(createClient).mockResolvedValue(supabase as never)

    await expect(login(formData({ email: 'a@b.com', password: 'secret', rememberMe: 'on' })))
      .rejects.toThrow('REDIRECT:/')

    expect(createClient).toHaveBeenCalledWith(true)
  })
})
