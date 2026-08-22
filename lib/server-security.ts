import { createClient } from '@supabase/supabase-js'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function getClientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function checkRateLimit(request: Request, key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now()
  const rateKey = `${key}:${getClientIp(request)}`
  const current = rateLimitStore.get(rateKey)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(rateKey, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0 }
  }

  current.count += 1
  return { ok: true, remaining: Math.max(limit - current.count, 0) }
}

export async function requireAdmin(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { ok: false as const, error: 'Faltan claves seguras en el servidor' }
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return { ok: false as const, error: 'Sesion no valida' }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token)

  if (error || !user) return { ok: false as const, error: 'Sesion no valida' }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { ok: false as const, error: 'No tienes permisos de admin' }
  }

  return { ok: true as const, serviceClient, user }
}
