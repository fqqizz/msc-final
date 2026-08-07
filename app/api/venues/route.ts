import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()

  const { data: venues, error } = await supabase
    .from('venues')
    .select(`
      id, name, slug, sport_type, description, short_description,
      status, max_capacity, dimensions, surface_type,
      rules_and_regulations, amenities, display_order,
      venue_images(id, image_url, caption, display_order, is_primary)
    `)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 })
  }

  return NextResponse.json({ venues: venues ?? [] })
}
