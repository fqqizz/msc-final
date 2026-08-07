import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('cms_testimonials')
    .select('id, customer_name, designation, rating, quote, avatar_url, display_order')
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }

  return NextResponse.json({ testimonials: data ?? [] })
}
