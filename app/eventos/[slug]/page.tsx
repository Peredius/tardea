import { supabase } from '@/lib/supabase'
import EventDetailClient from './EventDetailClient'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .eq('status', 'approved')
    .maybeSingle()

  return <EventDetailClient initialEvent={event} />
}
