import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabecera decorativa */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 h-48 rounded-b-[40px] flex items-center justify-center shadow-md">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
          <span className="text-white text-3xl font-bold">A</span>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-sm mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Bienvenido
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            Inicia sesión para continuar
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-base transition"
                placeholder="tu@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-base transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-sm active:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-6 pt-10">
        © {new Date().getFullYear()} Tu Empresa
      </p>
    </div>
  )
}