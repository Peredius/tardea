import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

// Generate from the live catalogue so newly published events reach search engines quickly.
export const dynamic = 'force-dynamic'

const baseUrl = 'https://www.tardea.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/tardeos-madrid`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/aviso-legal`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacidad`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/cookies`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/condiciones`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  const { data: events } = await supabase
    .from('events')
    .select('slug, date, created_at')
    .eq('published', true)
    .eq('status', 'approved')
    .order('date', { ascending: false })
    .limit(1000)

  const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${baseUrl}/eventos/${encodeURIComponent(event.slug)}`,
    lastModified: event.created_at ? new Date(event.created_at) : new Date(event.date),
    changeFrequency: 'weekly',
    priority: new Date(event.date) >= new Date() ? 0.8 : 0.3,
  }))

  return [...staticPages, ...eventPages]
}
