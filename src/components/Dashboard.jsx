import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const ADMIN_EMAIL = 'admin@empresa.com'

export default function Dashboard({ session }) {
  const [texto, setTexto] = useState('')
  const [borrador, setBorrador] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const esAdmin = session.user.email === ADMIN_EMAIL

  useEffect(() => {
    const cargarValores = async () => {
      const { data, error } = await supabase
        .from('empresa_config')
        .select('texto_valores')
        .eq('id', 1)

      if (!error && data) {
        setTexto(data.texto_valores)
        setBorrador(data.texto_valores)
      }
      setLoading(false)
    }

    cargarValores()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('empresa_config_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'empresa_config',
        },
        (payload) => {
          setTexto(payload.new.texto_valores)
          setBorrador(payload.new.texto_valores)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const guardarCambios = async () => {
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase
      .from('empresa_config')
      .update({ texto_valores: borrador })
      .eq('id', 1)

    if (error) {
      setMensaje('Error al guardar: ' + error.message)
    } else {
      setMensaje('¡Guardado correctamente!')
      setTimeout(() => setMensaje(''), 2000)
    }
    setGuardando(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
  }

  // Iniciales para el avatar
  const inicial = session.user.email.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {inicial}
            </div>
            <div>
              <p className="text-xs text-indigo-100">Sesión iniciada como</p>
              <p className="font-semibold text-sm">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-xs bg-white/15 px-3 py-1.5 rounded-full active:bg-white/25 transition"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-5 py-6 space-y-5">
        <section className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-indigo-500">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Nuestros valores
          </h2>

          {loading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : (
            <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
              {texto || 'Aún no se han definido valores.'}
            </p>
          )}
        </section>

        {!esAdmin && (
          <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              i
            </div>
            <p className="text-indigo-600 text-xs">
              Este contenido se actualiza en tiempo real para todo el equipo.
            </p>
          </div>
        )}

        {/* Panel de administración condicional */}
        {esAdmin && (
          <section className="bg-white rounded-2xl shadow-sm p-5 border-2 border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-600 mb-3 uppercase tracking-wider">
              Panel de administración
            </h3>
            <textarea
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              rows={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition"
              placeholder="Escribe los valores de la empresa..."
            />

            <button
              onClick={guardarCambios}
              disabled={guardando}
              className="w-full mt-3 bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-sm active:bg-indigo-700 transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {mensaje && (
              <p className={`text-center text-sm mt-3 rounded-lg py-2 ${
                mensaje.startsWith('Error')
                  ? 'text-red-600 bg-red-50'
                  : 'text-green-600 bg-green-50'
              }`}>
                {mensaje}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}