import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function AuthEmailPassword() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [error, setError] = useState(null)
  const [name, setName] = useState('') // new for signup

  const handleAuth = async (e) => {
    e.preventDefault()
    setError(null)

    if (isSigningUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } } // store name in user_metadata
      })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
  }

  return (
    <form onSubmit={handleAuth} className="space-y-4 max-w-sm mx-auto">
      <h2 className="text-lg font-bold mb-2 text-center">
        {isSigningUp ? 'Create an account' : 'Log in to FeelFlick'}
      </h2>
      {isSigningUp && (
        <input
          type="text"
          required
          placeholder="Your name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      )}
      <input
        type="email"
        required
        placeholder="Email"
        className="w-full p-2 border rounded"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        required
        placeholder="Password"
        className="w-full p-2 border rounded"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {isSigningUp ? 'Sign Up' : 'Log In'}
      </button>
      <p className="text-center text-sm">
        {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="text-blue-600 underline"
        >
          {isSigningUp ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </form>
  )
}
