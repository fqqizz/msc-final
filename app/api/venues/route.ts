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

  // Attach primary image to each venue
  const enriched = (venues ?? []).map(v => {
    const images = (v.venue_images ?? []) as { image_url: string; is_primary: boolean; display_order: number }[]
    const primary =
      images.find(i => i.is_primary) ??
      [...images].sort((a, b) => a.display_order - b.display_order)[0]
    return {
      id: v.id,
      name: v.name,
      slug: v.slug,
      sport_type: v.sport_type,
      description: v.description,
      short_description: v.short_description,
      status: v.status,
      max_capacity: v.max_capacity,
      dimensions: v.dimensions,
      surface_type: v.surface_type,
      rules_and_regulations: v.rules_and_regulations,
      amenities: v.amenities,
      display_order: v.display_order,
      primary_image: primary?.image_url ?? null,
    }
  })

  return NextResponse.json({ venues: enriched })
}
