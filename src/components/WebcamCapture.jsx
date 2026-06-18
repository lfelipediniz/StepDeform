import { useEffect, useRef, useState } from 'react'

// Largura de trabalho: o efeito é calculado pixel a pixel, então usamos uma
// resolução moderada (rápida e suave) e deixamos o CSS ampliar na tela.
const LARGURA_TRABALHO = 460

export default function WebcamCapture({ onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true

    async function iniciar() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        })
        if (!ativo) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          await videoRef.current.play().catch(() => {})
        }
        setPronto(true)
      } catch (e) {
        setErro(
          'Não foi possível acessar a webcam. Verifique a permissão da câmera no navegador ou use o botão "Enviar foto".'
        )
      }
    }

    iniciar()
    return () => {
      ativo = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function dimensoes(vw, vh) {
    const largura = LARGURA_TRABALHO
    const altura = Math.round(largura * (vh / vw))
    return { largura, altura }
  }

  function capturar() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const { largura, altura } = dimensoes(video.videoWidth, video.videoHeight)
    const cv = document.createElement('canvas')
    cv.width = largura
    cv.height = altura
    const ctx = cv.getContext('2d')
    // Espelha na horizontal para ficar igual ao preview (sensação de selfie).
    ctx.translate(largura, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, largura, altura)
    const imageData = ctx.getImageData(0, 0, largura, altura)
    onCapture({ imageData, largura, altura })
  }

  function enviarArquivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const { largura, altura } = dimensoes(img.width, img.height)
      const cv = document.createElement('canvas')
      cv.width = largura
      cv.height = altura
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, 0, 0, largura, altura)
      onCapture({ imageData: ctx.getImageData(0, 0, largura, altura), largura, altura })
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div className="captura">
      <div className="video-wrap">
        {erro ? (
          <div className="erro-cam">📷<span>{erro}</span></div>
        ) : (
          <video ref={videoRef} className="video-espelho" playsInline muted />
        )}
      </div>

      <div className="botoes">
        <button className="btn-principal" onClick={capturar} disabled={!pronto}>
          📸 Capturar foto
        </button>
        <label className="btn-secundario">
          Enviar foto
          <input type="file" accept="image/*" onChange={enviarArquivo} hidden />
        </label>
      </div>
      {!pronto && !erro && <p className="dica">Permita o acesso à câmera para começar…</p>}
    </div>
  )
}
