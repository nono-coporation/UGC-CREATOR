import { useState, useRef, useEffect } from 'react'
import './App.css'

const WEBHOOK_URL = 'https://n8n.socialmaster.com.br/webhook/ugc'

// Extract video URL from webhook response.
// The webhook may return the URL under different keys; check each in order.
function extractVideoUrl(data) {
  if (typeof data === 'string') return data
  return data.videoUrl || data.video_url || data.url || data.link || null
}

function App() {
  const [productName, setProductName] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // Revoke object URL when imagePreview changes or component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setVideoUrl(null)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!imageFile) {
      setError('Por favor, selecione uma imagem do produto.')
      return
    }
    if (!productName.trim()) {
      setError('Por favor, informe o nome do produto.')
      return
    }

    setLoading(true)
    setError(null)
    setVideoUrl(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('productName', productName.trim())

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const url = extractVideoUrl(data)

      if (!url) {
        throw new Error('O servidor não retornou um link de vídeo válido.')
      }

      setVideoUrl(url)
    } catch (err) {
      setError(err.message || 'Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-icon">🎥</div>
        <h1>Criador de Conteúdo UGC</h1>
        <p className="subtitle">Envie a imagem e o nome do produto para gerar seu vídeo automaticamente.</p>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="productName">Nome do Produto</label>
          <input
            id="productName"
            type="text"
            className="input"
            placeholder="Ex: Hidratante Facial Premium"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="label">Imagem do Produto</label>
          <div
            className={`upload-area ${imagePreview ? 'has-image' : ''}`}
            onClick={() => !loading && fileInputRef.current.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📷</span>
                <span>Clique para selecionar uma imagem</span>
                <span className="upload-hint">PNG, JPG, WEBP até 10MB</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="file-input-hidden"
            onChange={handleImageChange}
            disabled={loading}
          />
          {imagePreview && !loading && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setImageFile(null); setImagePreview(null); fileInputRef.current.value = '' }}
            >
              Trocar imagem
            </button>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" />
              Gerando vídeo...
            </span>
          ) : (
            '🎬 Gerar Vídeo'
          )}
        </button>
      </form>

      {loading && (
        <div className="info-box">
          <span className="info-icon">⏳</span>
          <p>Seu vídeo está sendo processado. Isso pode levar <strong>até 5 minutos</strong>. Por favor, aguarde.</p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {videoUrl && (
        <div className="video-section">
          <h2>🎉 Seu Vídeo Está Pronto!</h2>
          <video
            className="video-player"
            src={videoUrl}
            controls
            autoPlay
          >
            Seu navegador não suporta a reprodução de vídeo.
          </video>
          <a
            className="btn-download"
            href={videoUrl}
            download="video-ugc.mp4"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⬇️ Baixar Vídeo
          </a>
        </div>
      )}
    </div>
  )
}

export default App
