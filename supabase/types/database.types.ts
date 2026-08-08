export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'super_admin' | 'owner' | 'reception' | 'customer'
export type UserStatus = 'active' | 'suspended' | 'deactivated' | 'pending_verification'
export type AuthMethod = 'phone' | 'email' | 'oauth' | 'guest' | 'magic_link'
export type CustomerTier = 'new' | 'regular' | 'vip' | 'blacklisted'
export type SportType = 'football' | 'cricket' | 'bowling' | 'pickleball' | 'volleyball' | 'basketball' | 'badminton' | 'multi_purpose'
export type VenueStatus = 'active' | 'maintenance' | 'inactive' | 'coming_soon'
export type ResourceStatus = 'available' | 'maintenance' | 'out_of_service' | 'reserved'
export type BookingStatus = 'draft' | 'locked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type BookingPaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded' | 'partially_refunded' | 'failed'
export type BookingSource = 'online_customer' | 'walk_in' | 'phone' | 'reception_manual' | 'admin_reserved'
export type PaymentGateway = 'razorpay' | 'cash' | 'pos_terminal' | 'bank_transfer'
export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash' | 'pos'
export type PaymentStatusType = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded'
export type NotificationChannel = 'email' | 'whatsapp' | 'push' | 'sms'
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      customers: {
        Row: {
          id: string
          tier: CustomerTier
          hours_played: number
          total_bookings: number
          total_spend: number
          preferred_venue_id: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          date_of_birth: string | null
          internal_notes: string | null
          tags: string[]
          is_blacklisted: boolean
          blacklist_reason: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      venues: {
        Row: {
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
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['venues']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          booking_number: string
          customer_id: string
          venue_id: string
          start_time: string
          end_time: string
          duration_hours: number
          booking_status: BookingStatus
          payment_status: BookingPaymentStatus
          booking_source: BookingSource
          base_amount: number
          extra_charges: number
          discount_amount: number
          tax_amount: number
          total_amount: number
          amount_paid: number
          created_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booking_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          gateway: PaymentGateway
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          amount: number
          currency: string
          status: PaymentStatusType
          payment_method: PaymentMethodType
          raw_response: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
  }
}
