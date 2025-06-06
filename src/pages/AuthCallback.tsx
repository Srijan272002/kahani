import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { User } from '../types/auth'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const { setUser, setSession } = useAuthStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) throw error
        if (session) {
          const userWithExtras: User = {
            ...session.user,
            displayName:
              session.user.user_metadata?.name || session.user.email || '',
            photoURL: session.user.user_metadata?.avatar_url || '',
          }
          setUser(userWithExtras)
          setSession(session)
          navigate('/landing', { replace: true })
        }
      } catch (error) {
        console.error('Error during auth callback:', error)
        navigate('/login', { replace: true })
      }
    }

    handleAuthCallback()
  }, [navigate, setUser, setSession])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
    </div>
  )
}
