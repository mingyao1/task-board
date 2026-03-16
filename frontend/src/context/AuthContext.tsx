import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  session: Session | null
  userId: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const initAuth = useCallback(async () => {
    try {
      // Check for existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession()

      if (existingSession) {
        setSession(existingSession)
        setIsLoading(false)
        return
      }

      // No session found — sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Anonymous sign-in failed:', error.message)
      } else {
        setSession(data.session)
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    initAuth()

    // Listen for auth state changes (token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initAuth])

  const value: AuthContextValue = {
    session,
    userId: session?.user?.id ?? null,
    isLoading,
    isAuthenticated: session !== null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
