import { useEffect, useRef, useState } from 'react'
import { STEPS, CODIGO } from '../data/steps.js'
import { applyFisheye, distanceOverlay, angleOverlay } from '../lib/fisheye.js'

export default function StepViewer({ src, geom, onReiniciar }) {
  const canvasRef = useRef(null)
  const origRef = useRef(null)
  const animRef = useRef(0)
  const forcaRef = useRef(1.0)

  const [idx, setIdx] = useState(0)
  const [forca, setForca] = useState(1.0)
  const [tour, setTour] = useState(false)

  const step = STEPS[idx]
  const ehUltimo = idx === STEPS.length - 1

  // mantém uma cópia "viva" da força para os callbacks de animação
  useEffect(() => {
    forcaRef.current = forca
  }, [forca])

  // miniatura da foto original (referência sempre visível)
  useEffect(() => {
    const cv = origRef.current
    if (!cv) return
    cv.width = geom.largura
    cv.height = geom.altura
    cv.getContext('2d').putImageData(src, 0, 0)
  }, [src, geom])

  // ---- animação da força ao trocar de passo --------------------------------
  useEffect(() => {
    cancelAnimationFrame(animRef.current)

    // Passos sem distorção: a imagem fica igual à original (força = 1.0).
    if (step.modo !== 'distort' && step.modo !== 'remap' && step.modo !== 'result') {
      setForca(1.0)
      forcaRef.current = 1.0
      return
    }
    animarForca(forcaRef.current, step.forcaAlvo, step.modo === 'distort' ? 1100 : 450)
    return () => cancelAnimationFrame(animRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  // ---- redesenha sempre que a força ou o passo mudam -----------------------
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    cv.width = geom.largura
    cv.height = geom.altura
    const ctx = cv.getContext('2d')
    const modo = step.modo

    let img
    if (modo === 'distance') img = distanceOverlay(src, geom)
    else if (modo === 'angle') img = angleOverlay(src, geom)
    else if (modo === 'distort' || modo === 'remap' || modo === 'result')
      img = applyFisheye(src, geom, forca)
    else img = src // original / grid usam os pixels originais

    ctx.putImageData(img, 0, 0)

    if (modo === 'grid') desenharGrade(ctx, geom)
    else if (modo === 'distance') desenharAneis(ctx, geom)
    else if (modo === 'angle') desenharRaios(ctx, geom)
    else if (modo === 'distort') desenharCurva(ctx, forca)
    else if (modo === 'remap') desenharSetas(ctx, geom, forca)
  }, [forca, idx, src, geom, step.modo])

  // ---- navegação por teclado (setas) ---------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') irPara((i) => i + 1)
      else if (e.key === 'ArrowLeft') irPara((i) => i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---- tour automático ------------------------------------------------------
  useEffect(() => {
    if (!tour) return
    if (ehUltimo) {
      setTour(false)
      return
    }
    const ms = step.modo === 'distort' ? 2800 : 2200
    const t = setTimeout(() => setIdx((i) => Math.min(STEPS.length - 1, i + 1)), ms)
    return () => clearTimeout(t)
  }, [tour, idx, ehUltimo, step.modo])

  function animarForca(inicio, alvo, dur) {
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
      const f = inicio + (alvo - inicio) * e
      setForca(f)
      forcaRef.current = f
      if (p < 1) animRef.current = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(tick)
  }

  function irPara(fn) {
    setTour(false)
    setIdx((i) => {
      const n = typeof fn === 'function' ? fn(i) : fn
      return Math.max(0, Math.min(STEPS.length - 1, n))
    })
  }

  function reproduzir() {
    setForca(1.0)
    forcaRef.current = 1.0
    animarForca(1.0, 1.8, 1400)
  }

  function mudarForcaManual(v) {
    cancelAnimationFrame(animRef.current)
    setForca(v)
    forcaRef.current = v
  }

  const mostraForca =
    step.modo === 'distort' || step.modo === 'remap' || step.modo === 'result'

  return (
    <div className="viewer">
      {/* Coluna da imagem */}
      <div className="palco">
        <div className="canvas-card">
          <canvas ref={canvasRef} className="canvas-principal" />
          {mostraForca && (
            <span className="badge-forca">
              força = {forca.toFixed(2)}
            </span>
          )}
        </div>

        {/* Controles de força no passo final */}
        {step.modo === 'result' && (
          <div className="slider-area">
            <div className="slider-linha">
              <span>suave</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={forca}
                onChange={(e) => mudarForcaManual(parseFloat(e.target.value))}
              />
              <span>extremo</span>
            </div>
            <button className="btn-mini" onClick={reproduzir}>↻ Reproduzir 1.0 → 1.8</button>
          </div>
        )}
        {step.modo === 'distort' && (
          <div className="slider-area">
            <button className="btn-mini" onClick={reproduzir}>↻ Reproduzir transformação</button>
          </div>
        )}
      </div>

      {/* Coluna da explicação */}
      <div className="explicacao-card">
        <div className="passo-topo">
          <span className="passo-contador">
            Passo {idx + 1} de {STEPS.length}
          </span>
        </div>
        <h2 className="passo-titulo">{step.titulo}</h2>
        <p className="passo-texto">{step.explicacao}</p>

        <pre className="codigo">
          {CODIGO.map((linha, i) => (
            <div
              key={i}
              className={'linha' + (step.linhas.includes(i) ? ' destaque' : '')}
            >
              <span className="num">{i + 1}</span>
              <span className="txt">{linha || ' '}</span>
            </div>
          ))}
        </pre>

        <div className="referencia">
          <span>foto original</span>
          <canvas ref={origRef} className="canvas-mini" />
        </div>
      </div>

      {/* Barra de navegação */}
      <div className="navbar">
        <button className="btn-nav" onClick={() => irPara((i) => i - 1)} disabled={idx === 0}>
          ◀ Anterior
        </button>

        <div className="passos-pontos">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={'ponto' + (i === idx ? ' ativo' : '') + (i < idx ? ' feito' : '')}
              title={s.rotulo}
              onClick={() => irPara(i)}
            >
              <span className="ponto-rotulo">{s.rotulo}</span>
            </button>
          ))}
        </div>

        <button className="btn-nav" onClick={() => irPara((i) => i + 1)} disabled={ehUltimo}>
          Próximo ▶
        </button>
      </div>

      <div className="acoes-extra">
        <button
          className="btn-secundario"
          onClick={() => {
            setIdx(0)
            setTour(true)
          }}
        >
          ▶ Tour automático
        </button>
        <button className="btn-secundario" onClick={onReiniciar}>
          📸 Nova foto
        </button>
      </div>
    </div>
  )
}

// ===========================================================================
//  Funções de desenho das sobreposições (operam em pixels do canvas)
// ===========================================================================

function comSombra(ctx, fn) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  ctx.shadowBlur = 3
  fn()
  ctx.restore()
}

/** Passo 1: grade de coordenadas com origem no centro e escala -1..+1. */
function desenharGrade(ctx, geom) {
  const { largura: W, altura: H } = geom
  ctx.save()
  // grade fina
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  for (let t = -1; t <= 1.0001; t += 0.25) {
    const x = ((t + 1) * W) / 2
    const y = ((t + 1) * H) / 2
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // eixos
  ctx.strokeStyle = 'rgba(124,92,255,0.95)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
  // ponto (0,0)
  ctx.fillStyle = '#ffd166'
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2); ctx.fill()
  // rótulos
  comSombra(ctx, () => {
    ctx.fillStyle = '#fff'
    ctx.font = '13px ui-monospace, monospace'
    ctx.fillText('(0,0)', W / 2 + 8, H / 2 - 8)
    ctx.fillText('-1', 5, H / 2 - 6)
    ctx.fillText('+1', W - 22, H / 2 - 6)
    ctx.fillText('-1', W / 2 + 6, 16)
    ctx.fillText('+1', W / 2 + 6, H - 8)
  })
  ctx.restore()
}

/** Passo 2: anéis de distância constante (centro perto, bordas longe). */
function desenharAneis(ctx, geom) {
  const { largura: W, altura: H } = geom
  ctx.save()
  ctx.lineWidth = 1.5
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  for (const r of [0.25, 0.5, 0.75, 1.0]) {
    ctx.beginPath()
    ctx.ellipse(W / 2, H / 2, (r * W) / 2, (r * H) / 2, 0, 0, Math.PI * 2)
    ctx.stroke()
    comSombra(ctx, () => {
      ctx.fillStyle = '#fff'
      ctx.font = '12px ui-monospace, monospace'
      ctx.fillText(r.toFixed(2), W / 2 + (r * W) / 2 - 30, H / 2 - 4)
    })
  }
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

/** Passo 3: raios mostrando direções (ângulo) a partir do centro. */
function desenharRaios(ctx, geom) {
  const { largura: W, altura: H } = geom
  const cx = W / 2, cy = H / 2
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.lineWidth = 1
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * (W / 2), cy + Math.sin(a) * (H / 2))
    ctx.stroke()
  }
  // um ângulo de exemplo destacado
  const aex = -Math.PI / 6
  ctx.strokeStyle = '#ffd166'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(aex) * W * 0.42, cy + Math.sin(aex) * H * 0.42)
  ctx.stroke()
  comSombra(ctx, () => {
    ctx.fillStyle = '#fff'
    ctx.font = '13px ui-monospace, monospace'
    ctx.fillText('ângulo θ', cx + Math.cos(aex) * W * 0.2, cy + Math.sin(aex) * H * 0.2 - 6)
  })
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

/** Passo 4: gráfico inset de y = x^força comparado à identidade y = x. */
function desenharCurva(ctx, forca) {
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  const w = 124, h = 124, pad = 14
  const x0 = 12, y0 = H - h - 12
  ctx.save()
  ctx.fillStyle = 'rgba(15,16,28,0.85)'
  caixaArredondada(ctx, x0, y0, w, h, 10)
  ctx.fill()
  const gx = x0 + pad, gy = y0 + pad, gw = w - 2 * pad, gh = h - 2 * pad
  // identidade y = x (sem efeito)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.setLineDash([4, 3])
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(gx, gy + gh); ctx.lineTo(gx + gw, gy); ctx.stroke()
  ctx.setLineDash([])
  // curva x^força
  ctx.strokeStyle = '#9b7bff'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let i = 0; i <= 48; i++) {
    const x = i / 48
    const y = Math.pow(x, forca)
    const px = gx + x * gw
    const py = gy + gh - y * gh
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText('d → d^' + forca.toFixed(2), gx - 2, gy - 2)
  ctx.restore()
}

/** Passo 5: setas mostrando de onde cada pixel "puxa" sua cor. */
function desenharSetas(ctx, geom, forca) {
  const { largura: W, altura: H } = geom
  const cx = W / 2, cy = H / 2
  ctx.save()
  ctx.strokeStyle = '#ffd166'
  ctx.fillStyle = '#ffd166'
  ctx.lineWidth = 2
  const dist = 0.7
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4
    // destino (posição final do pixel)
    const px = (dist * Math.cos(a) + 1) * (W / 2)
    const py = (dist * Math.sin(a) + 1) * (H / 2)
    // origem (de onde a cor é puxada) -> distância distorcida
    const dd = Math.pow(dist, forca)
    const ox = (dd * Math.cos(a) + 1) * (W / 2)
    const oy = (dd * Math.sin(a) + 1) * (H / 2)
    seta(ctx, ox, oy, px, py)
  }
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function seta(ctx, x1, y1, x2, y2) {
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const cab = 7
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - cab * Math.cos(ang - 0.4), y2 - cab * Math.sin(ang - 0.4))
  ctx.lineTo(x2 - cab * Math.cos(ang + 0.4), y2 - cab * Math.sin(ang + 0.4))
  ctx.closePath()
  ctx.fill()
}

function caixaArredondada(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
