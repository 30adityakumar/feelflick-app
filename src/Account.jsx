import { supabase } from './supabaseClient'

export default function Account({ session }) {
  const email = session?.user?.email || ''

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="text-white mb-8">
      <p className="text-xl font-bold mb-4">Welcome, {email}</p>

      <button
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
        onClick={signOut}
      >
        Sign Out
      </button>
    </div>
  )
}
