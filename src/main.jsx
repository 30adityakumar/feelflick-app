// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabase } from './shared/lib/supabase/client'
import {
  clearOAuthCallbackNonce,
  consumeOAuthCallbackNonce,
  readOAuthNonceFromUrl,
} from './shared/lib/auth/oauthNonce'

// Handle OAuth callback hash immediately, before React Router processes anything
async function handleOAuthHash() {
  const hash = window.location.hash
  
  // Check if we have OAuth tokens in the hash
  if (hash && hash.includes('access_token')) {
    try {
      // Parse the hash parameters
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const nonce = readOAuthNonceFromUrl()
      const isCallbackRoute = window.location.pathname === '/auth/callback'
      const nonceValid = nonce ? consumeOAuthCallbackNonce(nonce) : false
      
      if (!accessToken || !refreshToken || !isCallbackRoute || !nonceValid) {
        clearOAuthCallbackNonce()
        window.history.replaceState(null, '', '/')
        window.location.replace('/')
        return true // Prevent normal app mount
      }

      if (accessToken && refreshToken) {
        // Set the session
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        // Clean up the URL and redirect to callback route
        window.history.replaceState(null, '', '/auth/callback')
        window.location.replace('/auth/callback')
        return true // Prevent normal app mount
      }
    } catch {
      clearOAuthCallbackNonce()
      window.history.replaceState(null, '', '/')
      window.location.replace('/')
      return true
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
