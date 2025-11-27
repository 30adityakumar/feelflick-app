// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Handle OAuth callback hash immediately, before React Router processes anything
async function handleOAuthHash() {
  const hash = window.location.hash
  
  // Check if we have OAuth tokens in the hash
  if (hash && hash.includes('access_token')) {
    // Import supabase dynamically to handle OAuth
    const { supabase } = await import('./shared/lib/supabase/client')
    
    try {
      // Parse the hash parameters
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        // Set the session
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        // Clean up the URL and redirect to callback route
        window.history.replaceState(null, '', '/auth/callback')
        window.location.href = '/auth/callback'
        return true // Prevent normal app mount
      }
    } catch (error) {
      console.error('OAuth hash handling error:', error)
      window.history.replaceState(null, '', '/')
    }
  }
  
  return false // Continue with normal app mount
}

// Handle OAuth before mounting React
handleOAuthHash().then((handled) => {
  if (!handled) {
    // Only mount app if OAuth wasn't handled
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  }
})
