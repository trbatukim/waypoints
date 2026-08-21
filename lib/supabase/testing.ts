import { vi } from 'vitest'

export function formData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) fd.set(key, value)
  return fd
}

type PostgrestError = { message: string; code?: string }
type QueryResult<T = unknown> = { data: T | null; error: PostgrestError | null }

export function queryResult<T>(data: T | null, error: PostgrestError | null = null): QueryResult<T> {
  return { data, error }
}

const CHAIN_METHODS = [
  'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'ilike', 'like', 'in',
  'order', 'limit',
] as const

export function mockQueryBuilder(result: QueryResult) {
  const builder = {} as Record<string, unknown>
  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn(() => builder)
  }
  builder.maybeSingle = vi.fn(async () => result)
  builder.single = vi.fn(async () => result)
  builder.then = (onFulfilled: (r: QueryResult) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  return builder
}

export function mockSupabaseClient(overrides: {
  user?: { id: string } | null
  from?: Record<string, ReturnType<typeof mockQueryBuilder>>
  rpcResult?: QueryResult
  authError?: PostgrestError | null
} = {}) {
  const fromMock = vi.fn((table: string) => {
    const builder = overrides.from?.[table]
    if (!builder) throw new Error(`mockSupabaseClient: no mock configured for table "${table}"`)
    return builder
  })

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: overrides.user ?? null } })),
      signInWithPassword: vi.fn(async () => ({ error: overrides.authError ?? null })),
      signUp: vi.fn(async () => ({ error: overrides.authError ?? null })),
    },
    from: fromMock,
    rpc: vi.fn(async () => overrides.rpcResult ?? queryResult(null)),
  }
}
