import { NextResponse } from 'next/server'
import { checkRateLimit, requireAdmin } from '@/lib/server-security'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(request, 'scout-ping', 12, 60_000)
  if (!rateLimit.ok) {
    return NextResponse.json({ ok: false, error: 'Demasiados intentos. Prueba de nuevo en un minuto.' }, { status: 429 })
  }

  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: 401 })
  }

  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'Falta SERPER_API_KEY en Vercel',
      hasKey: false,
    }, { status: 400 })
  }

  try {
    const queries = [
      'Real Madrid',
      'tardeo Madrid',
      'tardeo Madrid entradas',
      'brunch Madrid entradas',
    ]
    const checks = []

    for (const query of queries) {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          gl: 'es',
          hl: 'es',
          num: 5,
        }),
      })

      const data = await response.json()
      const organic = data.organic || []

      checks.push({
        query,
        ok: response.ok,
        status: response.status,
        results: organic.length,
        responseKeys: Object.keys(data),
        rawError: data.message || data.error || null,
        examples: organic.slice(0, 3).map((item: any) => ({
          title: item.title || '',
          link: item.link || '',
        })),
      })
    }

    const totalResults = checks.reduce((total, check) => total + check.results, 0)
    const firstError = checks.find((check) => !check.ok)

    return NextResponse.json({
      ok: checks.every((check) => check.ok),
      status: firstError?.status || 200,
      hasKey: true,
      results: totalResults,
      checks,
      examples: checks.flatMap((check) => check.examples).slice(0, 5),
      rawError: firstError?.rawError || null,
    }, { status: firstError ? 400 : 200 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      hasKey: true,
      error: error instanceof Error ? error.message : 'No se pudo conectar con Serper',
    }, { status: 400 })
  }
}
