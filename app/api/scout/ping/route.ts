import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'Falta SERPER_API_KEY en Vercel',
      hasKey: false,
    }, { status: 400 })
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'tardeo Madrid entradas',
        gl: 'es',
        hl: 'es',
        num: 5,
      }),
    })

    const data = await response.json()
    const organic = data.organic || []

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      hasKey: true,
      results: organic.length,
      examples: organic.slice(0, 5).map((item: any) => ({
        title: item.title || '',
        link: item.link || '',
      })),
      rawError: data.message || data.error || null,
    }, { status: response.ok ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      hasKey: true,
      error: error instanceof Error ? error.message : 'No se pudo conectar con Serper',
    }, { status: 400 })
  }
}
