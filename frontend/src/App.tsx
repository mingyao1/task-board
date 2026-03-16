import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-10 h-10 border-2 border-[#27272A] border-t-[#6366F1] rounded-full animate-spin" />
        <p className="text-sm text-[#71717A]">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    // Anonymous auth failed — show a minimal error state
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm px-6">
          <p className="text-[#FAFAFA] font-medium">Unable to connect</p>
          <p className="text-sm text-[#71717A]">
            Could not establish a session. Check your Supabase configuration and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded-md bg-[#6366F1] text-white text-sm font-medium hover:bg-[#4F46E5] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <AppShell />
}

export default App
