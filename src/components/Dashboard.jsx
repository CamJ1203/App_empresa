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

  // Nombre a mostrar: parte antes del @ del email
  const nombre = session.user.email.split('@')[0]
  const nombreMostrar = nombre.charAt(0).toUpperCase() + nombre.slice(1)

  // Fecha actual en español
  const fecha = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const fechaMostrar = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  useEffect(() => {
    const cargarValores = async () => {
      const { data, error } = await supabase
        .from('empresa_config')
        .select('texto_valores')
        .eq('id', 1)
        .single()

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
          filter: 'id=eq.1',
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header estilo mockup4 */}
      <header className="bg-gradient-to-br from-indigo-500 to-indigo-700 px-6 pt-14 pb-8 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Hola, {nombreMostrar}
            </h1>
            <p className="text-indigo-200 text-sm mt-1">{fechaMostrar}</p>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-xs text-indigo-200 bg-white/15 px-3 py-1.5 rounded-full mt-1 active:bg-white/25 transition"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Cuerpo */}
      <main className="flex-1 px-5 py-6 space-y-4">

        {/* Tarjeta de valores — borde indigo como las cards del mockup */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex">
            <div className="w-1.5 bg-indigo-500 shrink-0 rounded-l-2xl" />
            <div className="p-5 flex-1">
              <h2 className="text-base font-bold text-gray-800 mb-2">
                Nuestros valores
              </h2>
              {loading ? (
                <p className="text-gray-400 text-sm">Cargando...</p>
              ) : (
                <p className="text-gray-500 text-sm whitespace-pre-line leading-relaxed">
                  {texto || 'Aún no se han definido valores.'}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Info para empleados — borde verde */}
        {!esAdmin && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex">
              <div className="w-1.5 bg-green-500 shrink-0 rounded-l-2xl" />
              <div className="p-4 flex-1">
                <p className="text-gray-700 text-sm font-medium">
                  Contenido actualizado en tiempo real
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Cualquier cambio se refleja al instante para todo el equipo
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Panel de administración — borde naranja */}
        {esAdmin && (
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex">
              <div className="w-1.5 bg-amber-400 shrink-0 rounded-l-2xl" />
              <div className="p-5 flex-1">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
                  Panel de administración
                </h3>
                <textarea
                  value={borrador}
                  onChange={(e) => setBorrador(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white resize-none transition"
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
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}