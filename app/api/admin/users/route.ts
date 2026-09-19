import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join(', ') : String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request)
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const authUsers: any[] = []
  let page = 1

  while (true) {
    const { data, error } = await admin.serviceClient.auth.admin.listUsers({
      page,
      perPage: 100,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    authUsers.push(...data.users)
    if (data.users.length < 100) break
    page += 1
  }

  const ids = authUsers.map((user) => user.id)
  const { data: profiles, error: profilesError } = ids.length
    ? await admin.serviceClient
        .from('profiles')
        .select('id, role, venue_name, first_name, last_name, birth_date, municipality, province, postal_code, mobile_phone, music_preferences, area_preferences, created_at')
        .in('id', ids)
    : { data: [], error: null }

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]))
  const users = authUsers
    .map((user) => {
      const profile: any = profileById.get(user.id) || {}
      const metadata = user.user_metadata || {}
      const marketingConsent = metadata.marketingConsent === true

      return {
        id: user.id,
        email: user.email || '',
        emailConfirmed: Boolean(user.email_confirmed_at),
        role: profile.role || metadata.role || 'user',
        firstName: profile.first_name || metadata.firstName || '',
        lastName: profile.last_name || metadata.lastName || '',
        venueName: profile.venue_name || metadata.venueName || '',
        birthDate: profile.birth_date || metadata.birthDate || '',
        municipality: profile.municipality || metadata.municipality || '',
        province: profile.province || metadata.province || '',
        postalCode: profile.postal_code || metadata.postalCode || '',
        phone: profile.mobile_phone || '',
        musicPreferences: profile.music_preferences || metadata.musicPrefs || [],
        areaPreferences: profile.area_preferences || [],
        marketingConsent,
        createdAt: user.created_at || profile.created_at || '',
        lastSignInAt: user.last_sign_in_at || '',
      }
    })
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))

  const url = new URL(request.url)
  if (url.searchParams.get('format') === 'csv') {
    const newsletterOnly = url.searchParams.get('scope') === 'newsletter'
    const exportUsers = newsletterOnly
      ? users.filter((user) => user.marketingConsent)
      : users
    const headers = [
      'Email', 'Nombre', 'Apellidos', 'Tipo de cuenta', 'Local/empresa',
      'Municipio', 'Provincia', 'Código postal', 'Teléfono',
      'Preferencias musicales', 'Zonas favoritas', 'Acepta newsletter',
      'Email confirmado', 'Fecha de alta', 'Último acceso',
    ]
    const rows = exportUsers.map((user) => [
      user.email,
      user.firstName,
      user.lastName,
      user.role,
      user.venueName,
      user.municipality,
      user.province,
      user.postalCode,
      user.phone,
      user.musicPreferences,
      user.areaPreferences,
      user.marketingConsent ? 'Sí' : 'No',
      user.emailConfirmed ? 'Sí' : 'No',
      user.createdAt,
      user.lastSignInAt,
    ])
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tardea-${newsletterOnly ? 'newsletter' : 'usuarios'}-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.json({
    users,
    totals: {
      registered: users.length,
      newsletter: users.filter((user) => user.marketingConsent).length,
    },
  })
}
