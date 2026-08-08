'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/supabase/types/database.types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type CustomerRecord = Database['public']['Tables']['customers']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  customer: CustomerRecord | null
  role: string | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  customer: null,
  role: null,
  isLoading: true,
  logout: async () => {},
  refreshProfile: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [customer, setCustomer] = useState<CustomerRecord | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchUserData = async (currentUser: User) => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileData) {
        // If profileData.full_name is missing, fallback to auth user_metadata
        const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.user_metadata?.display_name
        if (!profileData.full_name && metaName) {
          profileData.full_name = metaName
        } else if (!profileData.full_name && profileData.role === 'owner') {
          profileData.full_name = 'Eihab Naseer'
        }
        setProfile(profileData)
        setRole(profileData.role)
      } else {
        // Fallback role and profile from user_metadata
        const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.user_metadata?.display_name
        setProfile({
          id: currentUser.id,
          full_name: metaName || (currentUser.email?.toLowerCase().includes('owner') || currentUser.email?.toLowerCase().includes('eihab') ? 'Eihab Naseer' : 'MSC Player'),
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          role: 'customer' as any,
          avatar_url: null,
          created_at: currentUser.created_at,
          updated_at: currentUser.created_at,
          is_active: true
        } as any)
        setRole('customer')
      }

      // Fetch customer data if exists
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (customerData) {
        setCustomer(customerData)
      }
    } catch (err) {
      console.error('Error fetching user profile data:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          await fetchUserData(initialSession.user)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await fetchUserData(newSession.user)
      } else {
        setProfile(null)
        setCustomer(null)
        setRole(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setCustomer(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      customer,
      role,
      isLoading,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
