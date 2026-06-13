import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
const Admin_Email = "admin@empresa.com"
export default function Dashboard({session}) {
    const [texto, setTexto] = useState("")
    const [borrador, setBorrador] = useState("")
    const [loading, setLoading] = useState(true)
    const [guardado, setGuardado] = useState(false)
    const[mensaje, setMensaje] = useState("")
    
    const isAdmin = session.user.email === Admin_Email
    //CARGA INICIAL DEL TEXTO
    useEffect(() => {
        const cargarValores = async () => {
            const {data, error} = await supabase.from("empresa_config").select("texto_valores").single()
            if (!error && data) {
                setTexto(data.texto_valores)
                setBorrador(data.texto_valores)
            }
            setLoading(false)
        }
        cargarValores()
    }, [])

    //SUSCRIPCIÓN EN TIEMPO REAL CAMBIOS EN LA TABLA

    useEffect(() => {
        const channel = supabase
            .channel("empresa_config_changes")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "empresa_config" }, (payload) => {
                setTexto(payload.new.texto_valores)
                setBorrador(payload.new.texto_valores)
            })
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const guardarCambios = async () => {
        setGuardado(true)
        setMensaje("")
        
        const { error } = await supabase.from("empresa_config").update({ texto_valores: borrador }).eq("id", 1)

        if (error) {
            setMensaje("Error al guardar: " + error.message)
        } else {
            setMensaje("Cambios guardados correctamente")
            setTimeout(() => setMensaje(""), 2000)
        }
        setGuardado(false)
    }
    const cerrarSesion = async () => {
        await supabase.auth.signOut()
    }

     return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header tipo app nativa */}
      <header className="bg-indigo-600 text-white px-5 pt-12 pb-5 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs opacity-80">Sesión iniciada como</p>
            <p className="font-semibold text-sm">{session.user.email}</p>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-xs bg-white/20 px-3 py-1.5 rounded-full active:bg-white/30"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-5 py-6 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm p-5">
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

        {/* Panel de administración condicional */}
        {isAdmin && (
          <details className="bg-white rounded-2xl shadow-sm p-5 border-2 border-indigo-100">
            <summary className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wide">
              Panel de administración
            </summary>
            <textarea
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Escribe los valores de la empresa..."
            />

            <button
              onClick={guardarCambios}
              disabled={guardado}
              className="w-full mt-3 bg-indigo-600 text-white font-semibold py-3 rounded-xl active:bg-indigo-700 transition disabled:opacity-50"
            >
              {guardado ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {mensaje && (
              <p className="text-center text-sm mt-2 text-green-600">
                {mensaje}
              </p>
            )}
            <summary className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wide">
              Tablon de anuncios
            </summary>
            

          </details>
          
        )}
      </main>
    </div>
  )
}