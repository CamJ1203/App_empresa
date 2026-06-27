import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard({ session }) {
  const [activeModule, setActiveModule] = useState('feed')
  const [texto, setTexto] = useState('')
  const [borrador, setBorrador] = useState('')
  const [configLoading, setConfigLoading] = useState(true)
  const [savingValues, setSavingValues] = useState(false)
  const [configMessage, setConfigMessage] = useState('')
  const [esAdmin, setEsAdmin] = useState(false)

  const [feedPosts, setFeedPosts] = useState([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedSaving, setFeedSaving] = useState(false)
  const [feedMessage, setFeedMessage] = useState('')
  const [feedTitle, setFeedTitle] = useState('')
  const [feedBody, setFeedBody] = useState('')
  const [feedLinkUrl, setFeedLinkUrl] = useState('')
  const [feedImageUrl, setFeedImageUrl] = useState('')
  const [feedImageFile, setFeedImageFile] = useState(null)

  const [pdfFiles, setPdfFiles] = useState([])
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfMessage, setPdfMessage] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [pdfFile, setPdfFile] = useState(null)

  useEffect(() => {
    const cargarRol = async () => {
      const email = session.user.email?.trim().toLowerCase()
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('email', email)
        .maybeSingle()

      const role = data?.role?.toString().trim().toLowerCase()
      setEsAdmin(role === 'admin')

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando rol de usuario:', error)
      }
    }

    cargarRol()
  }, [session.user.email])

  const nombre = session.user.email.split('@')[0]
  const nombreMostrar = nombre.charAt(0).toUpperCase() + nombre.slice(1)
  const fecha = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const fechaMostrar = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  const fechaFormato = (value) =>
    new Date(value).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

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
      setConfigLoading(false)
    }

    cargarValores()
  }, [])

  useEffect(() => {
    const cargarFeed = async () => {
      const { data, error } = await supabase
        .from('feed_posts')
        .select('id,title,body,image_url,link_url,author_email,created_at')
        .order('created_at', { ascending: false })

      if (!error) setFeedPosts(data || [])
      setFeedLoading(false)
    }

    const cargarPdfs = async () => {
      const { data, error } = await supabase
        .from('pdf_files')
        .select('id,name,url,uploaded_by,created_at')
        .order('created_at', { ascending: false })

      if (!error) setPdfFiles(data || [])
      setPdfLoading(false)
    }

    cargarFeed()
    cargarPdfs()

    const feedChannel = supabase
      .channel('feed_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_posts',
        },
        () => cargarFeed()
      )
      .subscribe()

    const pdfChannel = supabase
      .channel('pdf_files_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pdf_files',
        },
        () => cargarPdfs()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(feedChannel)
      supabase.removeChannel(pdfChannel)
    }
  }, [])

  const guardarCambios = async () => {
    setSavingValues(true)
    setConfigMessage('')

    const { error } = await supabase
      .from('empresa_config')
      .update({ texto_valores: borrador })
      .eq('id', 1)

    if (error) {
      setConfigMessage('Error al guardar: ' + error.message)
    } else {
      setConfigMessage('¡Guardado correctamente!')
      setTimeout(() => setConfigMessage(''), 2500)
    }
    setSavingValues(false)
  }

  const publicarFeed = async () => {
    if (!feedBody.trim() && !feedImageUrl.trim() && !feedImageFile) {
      setFeedMessage('Escribe texto, agrega una imagen o ambos para publicar.')
      return
    }

    setFeedSaving(true)
    setFeedMessage('')

    let imageUrl = feedImageUrl.trim()

    if (feedImageFile) {
      const filePath = `feed/${Date.now()}_${feedImageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('feed_images')
        .upload(filePath, feedImageFile, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        setFeedMessage('Error subiendo imagen: ' + uploadError.message)
        setFeedSaving(false)
        return
      }

      const { data: publicData } = supabase.storage
        .from('feed_images')
        .getPublicUrl(filePath)

      imageUrl = publicData.publicUrl
    }

    const { error } = await supabase.from('feed_posts').insert({
      title: feedTitle || null,
      body: feedBody || null,
      image_url: imageUrl || null,
      link_url: feedLinkUrl || null,
      author_email: session.user.email,
    })

    if (error) {
      setFeedMessage('Error guardando anuncio: ' + error.message)
    } else {
      setFeedMessage('Anuncio publicado correctamente.')
      setFeedTitle('')
      setFeedBody('')
      setFeedLinkUrl('')
      setFeedImageUrl('')
      setFeedImageFile(null)
    }
    setFeedSaving(false)
  }

  const subirPdf = async () => {
    if (!pdfFile) {
      setPdfMessage('Selecciona un archivo PDF para subir.')
      return
    }

    setPdfUploading(true)
    setPdfMessage('')

    const filePath = `pdfs/${Date.now()}_${pdfFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('pdf_files')
      .upload(filePath, pdfFile, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setPdfMessage('Error subiendo PDF: ' + uploadError.message)
      setPdfUploading(false)
      return
    }

    const { data: publicData } = supabase.storage
      .from('pdf_files')
      .getPublicUrl(filePath)

    const publicUrl = publicData.publicUrl

    const { error } = await supabase.from('pdf_files').insert({
      name: pdfName || pdfFile.name,
      url: publicUrl,
      file_path: filePath,
      uploaded_by: session.user.email,
    })

    if (error) {
      setPdfMessage('Error guardando metadatos: ' + error.message)
    } else {
      setPdfMessage('PDF subido correctamente.')
      setPdfName('')
      setPdfFile(null)
    }
    setPdfUploading(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gradient-to-br from-indigo-500 to-indigo-700 px-6 pt-14 pb-8 rounded-b-3xl shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-indigo-200 font-semibold uppercase tracking-[0.2em]">
              Módulo
            </div>
            <select
              value={activeModule}
              onChange={(e) => setActiveModule(e.target.value)}
              className="rounded-2xl border border-white/30 bg-slate-900/90 text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ color: '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
            >
              <option value="feed">Feed principal</option>
              <option value="nosotros">Nosotros</option>
            </select>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <h1 className="text-3xl font-bold text-white">Hola, {nombreMostrar}</h1>
            <p className="text-indigo-200 text-sm mt-1">{fechaMostrar}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/80 max-w-2xl text-sm leading-6">
            Usa el menú para navegar entre el feed, los valores de la empresa y los PDFs. Los anuncios se muestran en cascada con el más reciente arriba.
          </p>
          <button
            onClick={cerrarSesion}
            className="self-start rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/25"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-5">
        {activeModule === 'feed' && (
          <section className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="bg-white rounded-3xl shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">
                      Feed principal
                    </p>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Noticias y anuncios del equipo
                    </h2>
                  </div>
                  <span className="rounded-2xl bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                    {feedPosts.length} anuncios
                  </span>
                </div>

                {esAdmin && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Título opcional</label>
                      <input
                        value={feedTitle}
                        onChange={(e) => setFeedTitle(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Título breve para el anuncio"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Texto</label>
                      <textarea
                        value={feedBody}
                        onChange={(e) => setFeedBody(e.target.value)}
                        rows={5}
                        className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        placeholder="Escribe aquí el anuncio, la tarea didáctica o el enlace de la encuesta..."
                      />
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">URL de imagen</label>
                        <input
                          value={feedImageUrl}
                          onChange={(e) => setFeedImageUrl(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Link opcional</label>
                        <input
                          value={feedLinkUrl}
                          onChange={(e) => setFeedLinkUrl(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          placeholder="https://encuesta.com/..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Subir imagen</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFeedImageFile(e.target.files?.[0] || null)}
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      {feedImageFile && (
                        <p className="mt-2 text-xs text-gray-500">Imagen lista: {feedImageFile.name}</p>
                      )}
                    </div>
                    <button
                      onClick={publicarFeed}
                      disabled={feedSaving}
                      className="w-full rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {feedSaving ? 'Publicando...' : 'Publicar anuncio'}
                    </button>
                    {feedMessage && (
                      <p className={`rounded-2xl px-4 py-3 text-sm ${feedMessage.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {feedMessage}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Los anuncios pueden contener texto, imagen o ambos. Incluye un enlace cuando quieras compartir encuestas o actividades didácticas.
                    </p>
                  </div>
                )}
              </div>
            {esAdmin && (
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mt-6 space-y-4">
                  
                    <div className="rounded-3xl bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-700">Para el admin</p>
                      <p className="text-sm text-gray-600 mt-1">Puedes publicar texto, añadir imagen usando URL o subir archivo de imagen directamente.</p>
                    </div>
                  
                </div>
              </div>
            )}
            </div>

            <div className="space-y-4">
              {feedLoading ? (
                <div className="rounded-3xl bg-white p-8 shadow-sm text-center text-gray-500">Cargando anuncios...</div>
              ) : feedPosts.length === 0 ? (
                <div className="rounded-3xl bg-white p-8 shadow-sm text-center text-gray-500">No hay anuncios todavía.</div>
              ) : (
                feedPosts.map((post) => (
                  <article key={post.id} className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {post.title && <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>}
                        <p className="text-sm text-gray-500 mt-1">Publicado por {post.author_email} • {fechaFormato(post.created_at)}</p>
                      </div>
                      {post.link_url && (
                        <a
                          href={post.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Abrir enlace
                        </a>
                      )}
                    </div>
                    {post.body && <p className="mt-4 text-gray-700 whitespace-pre-line">{post.body}</p>}
                    {post.image_url && (
                      <div className="mt-4 overflow-hidden rounded-3xl border border-gray-200">
                        <img src={post.image_url} alt={post.title || 'Imagen del anuncio'} className="w-full object-cover" />
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeModule === 'nosotros' && (
          <section className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">Nosotros</p>
                    <h2 className="text-2xl font-semibold text-gray-900">Valores y documentos</h2>
                  </div>
                  <span className="rounded-2xl bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">Información del equipo</span>
                </div>

                {configLoading ? (
                  <p className="text-gray-500">Cargando valores...</p>
                ) : (
                  <p className="text-gray-600 leading-7 whitespace-pre-line">{texto || 'Aún no se han definido valores.'}</p>
                )}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Acceso rápido</h3>
                <p className="text-sm text-gray-600 leading-6">
                  En esta página puedes ver los valores de la empresa y acceder a los documentos PDF compartidos. Si eres administrador, también puedes actualizar valores y subir PDFs desde aquí.
                </p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
              <div className="space-y-5">
              {esAdmin && (
                <div className="bg-white rounded-3xl shadow-sm p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Valores de la empresa</h3>
                  </div>
                  
                    <div className="space-y-4">
                      <textarea
                        value={borrador}
                        onChange={(e) => setBorrador(e.target.value)}
                        rows={10}
                        className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                        placeholder="Edita los valores de la empresa aquí..."
                      />
                      <button
                        onClick={guardarCambios}
                        disabled={savingValues}
                        className="w-full rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingValues ? 'Guardando...' : 'Guardar valores'}
                      </button>
                      {configMessage && (
                        <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${configMessage.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {configMessage}
                        </p>
                      )}
                    </div>
                  
                </div>)}

                <div className="bg-white rounded-3xl shadow-sm p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Documentos PDF</h3>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">Acceso para el equipo</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-6 mb-4">Descarga los documentos que el administrador haya publicado. Mantén esta sección actualizada para tu equipo.</p>
                  <div className="space-y-4">
                    {pdfLoading ? (
                      <p className="text-sm text-gray-500">Cargando PDFs...</p>
                    ) : pdfFiles.length === 0 ? (
                      <p className="text-sm text-gray-500">No hay PDFs disponibles todavía.</p>
                    ) : (
                      pdfFiles.map((pdf) => (
                        <div key={pdf.id} className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{pdf.name}</p>
                              <p className="text-xs text-gray-500">Subido por {pdf.uploaded_by} • {fechaFormato(pdf.created_at)}</p>
                            </div>
                            <a
                              href={pdf.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                              Ver PDF
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {esAdmin && (
                  <div className="bg-white rounded-3xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir nuevo PDF</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Nombre del documento</label>
                        <input
                          value={pdfName}
                          onChange={(e) => setPdfName(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          placeholder="Título del documento (opcional)"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700">Selecciona PDF</label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                          className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                      <button
                        onClick={subirPdf}
                        disabled={pdfUploading}
                        className="w-full rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {pdfUploading ? 'Subiendo...' : 'Subir PDF'}
                      </button>
                      {pdfMessage && (
                        <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${pdfMessage.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {pdfMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
