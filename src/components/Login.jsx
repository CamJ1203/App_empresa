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
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header igual que el Dashboard */}
      <header className="bg-gradient-to-br from-indigo-500 to-indigo-700 px-6 pt-14 pb-8 rounded-b-3xl shadow-md">
        <h1 className="text-3xl font-bold text-white">Bienvenido</h1>
        <p className="text-indigo-200 text-sm mt-1">
          Inicia sesión para continuar
        </p>
      </header>

      {/* Formulario como tarjeta con borde indigo */}
      <main className="flex-1 px-5 py-6 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex">
            <div className="w-1.5 bg-indigo-500 shrink-0 rounded-l-2xl" />
            <form onSubmit={handleLogin} className="p-5 flex-1 space-y-4">

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
                  placeholder="tu@empresa.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-sm active:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>

            </form>
          </div>
        </section>

        {/* Error como tarjeta con borde rojo — mismo patrón */}
        {error && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex">
              <div className="w-1.5 bg-red-400 shrink-0 rounded-l-2xl" />
              <div className="p-4 flex-1">
                <p className="text-red-600 text-sm font-medium">
                  Error al iniciar sesión
                </p>
                <p className="text-red-400 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

      </main>

      <p className="text-center text-xs text-gray-400 pb-6">
        © {new Date().getFullYear()} Tu Empresa
      </p>
    </div>
  )
}