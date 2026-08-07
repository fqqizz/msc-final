export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed'
export type BookingSource = 'online' | 'walk_in' | 'phone' | 'admin'
export type SportType = 'football' | 'cricket' | 'multi_sport' | 'badminton' | 'other'
export type VenueStatus = 'active' | 'inactive' | 'maintenance'
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'customer' | 'guest'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'

export interface Venue {
  id: string
  name: string
  slug: string
  sport_type: SportType
  description: string | null
  short_description: string | null
  status: VenueStatus
  maintenance_reason: string | null
  max_capacity: number
  dimensions: string | null
  surface_type: string | null
  rules_and_regulations: string[]
  amenities: string[]
  display_order: number
  address: string | null
  latitude: number | null
  longitude: number | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  deleted_by: string | null
}

export interface VenueImage {
  id: string
  venue_id: string
  image_url: string
  caption: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

export interface PricingRule {
  id: string
  venue_id: string
  resource_id: string | null
  name: string
  day_of_week: number | null
  start_time: string
  end_time: string
  hourly_rate: number
  is_peak_hour: boolean
  is_weekend: boolean
  start_date: string | null
  end_date: string | null
  priority: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Booking {
  id: string
  booking_number: string
  customer_id: string
  venue_id: string
  start_time: string
  end_time: string
  duration_hours: number
  booking_status: BookingStatus
  payment_status: PaymentStatus
  booking_source: BookingSource
  base_amount: number
  extra_charges: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  amount_paid: number
  cancellation_reason: string | null
  cancelled_at: string | null
  notes: string | null
  metadata: Json
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface UserProfile {
  id: string
  full_name: string
  phone: string | null
  is_phone_verified: boolean
  email: string | null
  is_email_verified: boolean
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  is_guest: boolean
  metadata: Json
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Customer {
  id: string
  tier: string
  hours_played: number
  total_bookings: number
  total_spend: number
  preferred_venue_id: string | null
  last_booking_at: string | null
  last_seen_at: string | null
  is_blacklisted: boolean
  blacklist_reason: string | null
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  venue_id: string | null
  category_id: string
  name: string
  code: string
  status: string
  serial_number: string | null
  hourly_extra_cost: number
  quantity: number
  metadata: Json
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SlotLock {
  id: string
  venue_id: string
  resource_id: string | null
  start_time: string
  end_time: string
  locked_by_user_id: string
  session_id: string | null
  expires_at: string
  created_at: string
}

export interface CmsTestimonial {
  id: string
  customer_name: string
  designation: string | null
  rating: number
  quote: string
  avatar_url: string | null
  verified_booking_id: string | null
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CmsFaq {
  id: string
  category: string
  question: string
  answer: string
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface CmsGalleryItem {
  id: string
  title: string
  category: string
  media_type: string
  media_url: string
  thumbnail_url: string | null
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface CmsHeroBanner {
  id: string
  title: string
  subtitle: string | null
  cta_text: string | null
  cta_link: string | null
  background_media_url: string
  media_type: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationQueue {
  id: string
  recipient: string
  channel: string
  template_id: string | null
  subject: string | null
  body: string
  payload: Json
  status: string
  retry_count: number
  max_retries: number
  error_log: string | null
  scheduled_at: string
  sent_at: string | null
  created_at: string
  updated_at: string
}

// Joined types for API responses
export interface BookingWithVenue extends Booking {
  venue: Pick<Venue, 'id' | 'name' | 'slug' | 'sport_type'>
  customer: Pick<UserProfile, 'id' | 'full_name' | 'phone' | 'email'>
}

export interface VenueWithImages extends Venue {
  venue_images: VenueImage[]
  pricing_rules: PricingRule[]
}

// Slot availability type used on the booking page
export interface SlotAvailability {
  hour: number                  // 0-23
  label: string                 // '6 AM – 7 AM'
  start_time: string            // ISO
  end_time: string              // ISO
  available: boolean
  price: number                 // INR
  is_peak: boolean
}

// Database generic type for createBrowserClient / createServerClient
export interface Database {
  public: {
    Tables: {
      venues: { Row: Venue; Insert: Partial<Venue>; Update: Partial<Venue> }
      venue_images: { Row: VenueImage; Insert: Partial<VenueImage>; Update: Partial<VenueImage> }
      pricing_rules: { Row: PricingRule; Insert: Partial<PricingRule>; Update: Partial<PricingRule> }
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> }
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> }
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> }
      resources: { Row: Resource; Insert: Partial<Resource>; Update: Partial<Resource> }
      slot_locks: { Row: SlotLock; Insert: Partial<SlotLock>; Update: Partial<SlotLock> }
      cms_testimonials: { Row: CmsTestimonial; Insert: Partial<CmsTestimonial>; Update: Partial<CmsTestimonial> }
      cms_faqs: { Row: CmsFaq; Insert: Partial<CmsFaq>; Update: Partial<CmsFaq> }
      cms_gallery_items: { Row: CmsGalleryItem; Insert: Partial<CmsGalleryItem>; Update: Partial<CmsGalleryItem> }
      cms_hero_banners: { Row: CmsHeroBanner; Insert: Partial<CmsHeroBanner>; Update: Partial<CmsHeroBanner> }
      notification_queue: { Row: NotificationQueue; Insert: Partial<NotificationQueue>; Update: Partial<NotificationQueue> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      booking_status: BookingStatus
      payment_status: PaymentStatus
      booking_source: BookingSource
      sport_type: SportType
      venue_status: VenueStatus
      user_role: UserRole
      user_status: UserStatus
    }
  }
}
