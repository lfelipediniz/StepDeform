// ============================================================================
//  fisheye.js
//  Implementação FIEL, em JavaScript, do algoritmo "olho_de_peixe" do pôster.
//
//  Referência (Python / NumPy):
//
//    def olho_de_peixe(imagem, forca_do_efeito=1.8):
//        altura, largura = imagem.shape[:2]
//        pos_y, pos_x = np.indices((altura, largura))
//        x_centralizado = (2 * pos_x / largura) - 1
//        y_centralizado = (2 * pos_y / altura) - 1
//        distancia_centro = np.sqrt(x_centralizado**2 + y_centralizado**2)
//        angulo = np.arctan2(y_centralizado, x_centralizado)
//        distancia_distorcida = distancia_centro ** forca_do_efeito
//        novo_x = np.clip(((distancia_distorcida*np.cos(angulo)+1)*largura/2), 0, largura-1).astype(int)
//        novo_y = np.clip(((distancia_distorcida*np.sin(angulo)+1)*altura/2), 0, altura-1).astype(int)
//        return imagem[novo_y, novo_x]
//
//  Aqui a "imagem" é o array de pixels de um <canvas> (ImageData).
// ============================================================================

const MAX_DIST = Math.SQRT2 // distância máxima possível (cantos): sqrt(1^2 + 1^2)

/**
 * Pré-calcula a geometria de cada pixel: distância e ângulo até o centro.
 * Esses valores NÃO dependem da força do efeito - só do tamanho da imagem -
 * então calculamos uma única vez. Isso deixa a animação fluida, pois a cada
 * quadro só precisamos recalcular a potência da distância.
 */
export function buildGeometry(largura, altura) {
  const n = largura * altura
  const dist = new Float32Array(n) // distância até o centro (0 a ~1.414)
  const logDist = new Float32Array(n) // log(dist): acelera o cálculo da potência
  const ang = new Float32Array(n) // ângulo (radianos)
  const cosAng = new Float32Array(n) // cos do ângulo (pré-calculado)
  const sinAng = new Float32Array(n) // sen do ângulo (pré-calculado)

  let i = 0
  for (let posY = 0; posY < altura; posY++) {
    for (let posX = 0; posX < largura; posX++) {
      // 1. Move a referência (0,0) para o meio da tela -> escala [-1, +1]
      const xCentralizado = (2 * posX) / largura - 1
      const yCentralizado = (2 * posY) / altura - 1

      // 2. Mede a distância e o ângulo de cada pixel até o meio
      const d = Math.sqrt(xCentralizado * xCentralizado + yCentralizado * yCentralizado)
      const a = Math.atan2(yCentralizado, xCentralizado)

      dist[i] = d
      logDist[i] = Math.log(d) // d=0 (centro) -> -Infinity (tratado em applyFisheye)
      ang[i] = a
      cosAng[i] = Math.cos(a)
      sinAng[i] = Math.sin(a)
      i++
    }
  }
  return { largura, altura, dist, logDist, ang, cosAng, sinAng }
}

/**
 * Aplica o efeito olho-de-peixe e devolve um novo ImageData.
 *
 * Reproduz exatamente as últimas linhas do algoritmo:
 *   distancia_distorcida = distancia_centro ** forca
 *   novo_x = clip((distancia_distorcida*cos(ang)+1)*largura/2, 0, largura-1)
 *   novo_y = clip((distancia_distorcida*sin(ang)+1)*altura/2, 0, altura-1)
 *   return imagem[novo_y, novo_x]
 *
 * Observação: com força = 1.0, distancia_distorcida == distancia_centro, então
 * cada pixel volta exatamente para o seu lugar -> a imagem fica IGUAL à original.
 * É por isso que a animação parte de 1.0 (sem efeito) e cresce até 1.8.
 */
export function applyFisheye(src, geom, forca) {
  const { largura, altura, logDist, cosAng, sinAng } = geom
  const out = new ImageData(largura, altura)
  const s = src.data
  const d = out.data
  const maxX = largura - 1
  const maxY = altura - 1
  const meiaL = largura / 2
  const meiaA = altura / 2

  let i = 0
  for (let posY = 0; posY < altura; posY++) {
    for (let posX = 0; posX < largura; posX++) {
      // distancia_distorcida = dist ** forca  ==  exp(forca * log(dist))
      const distD = Math.exp(forca * logDist[i]) // centro: exp(-Inf)=0 -> volta ao centro

      // 4. Traduz de volta para posições normais na tela (+ np.clip + astype(int))
      let novoX = ((distD * cosAng[i] + 1) * meiaL) | 0 // | 0 = trunca p/ inteiro
      let novoY = ((distD * sinAng[i] + 1) * meiaA) | 0
      if (novoX < 0) novoX = 0
      else if (novoX > maxX) novoX = maxX
      if (novoY < 0) novoY = 0
      else if (novoY > maxY) novoY = maxY

      // Puxa o pixel da imagem original (novoY, novoX) para a posição atual
      const sIdx = (novoY * largura + novoX) << 2
      const dIdx = i << 2
      d[dIdx] = s[sIdx]
      d[dIdx + 1] = s[sIdx + 1]
      d[dIdx + 2] = s[sIdx + 2]
      d[dIdx + 3] = 255
      i++
    }
  }
  return out
}

// ---------------------------------------------------------------------------
//  Visualizações didáticas (mapas de campo sobrepostos à foto)
// ---------------------------------------------------------------------------

/** Mapa de calor "jet": u=0 frio (azul) ... u=1 quente (vermelho). */
function jet(u) {
  u = u < 0 ? 0 : u > 1 ? 1 : u
  const r = Math.round(255 * clamp01(1.5 - Math.abs(4 * u - 3)))
  const g = Math.round(255 * clamp01(1.5 - Math.abs(4 * u - 2)))
  const b = Math.round(255 * clamp01(1.5 - Math.abs(4 * u - 1)))
  return [r, g, b]
}
function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** Converte HSL (h em graus, s/l em 0..1) para [r,g,b] 0..255. */
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = l - c / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

/**
 * Sobrepõe à foto um mapa de calor da DISTÂNCIA ao centro.
 * Centro = quente (perto), bordas = frias (longe).
 */
export function distanceOverlay(src, geom, alpha = 0.6) {
  const { largura, altura, dist } = geom
  const out = new ImageData(largura, altura)
  const s = src.data
  const d = out.data
  const inv = 1 - alpha
  for (let i = 0; i < dist.length; i++) {
    const t = Math.min(1, dist[i] / MAX_DIST) // 0 no centro, 1 nas bordas
    const c = jet(1 - t) // 1-t => centro quente
    const j = i << 2
    d[j] = s[j] * inv + c[0] * alpha
    d[j + 1] = s[j + 1] * inv + c[1] * alpha
    d[j + 2] = s[j + 2] * inv + c[2] * alpha
    d[j + 3] = 255
  }
  return out
}

/**
 * Sobrepõe à foto um mapa de cores do ÂNGULO de cada pixel (roda de matiz).
 * Cada direção em torno do centro ganha uma cor diferente.
 */
export function angleOverlay(src, geom, alpha = 0.6) {
  const { largura, altura, ang } = geom
  const out = new ImageData(largura, altura)
  const s = src.data
  const d = out.data
  const inv = 1 - alpha
  for (let i = 0; i < ang.length; i++) {
    const hue = ((ang[i] + Math.PI) / (2 * Math.PI)) * 360 // -π..π -> 0..360
    const c = hslToRgb(hue, 0.85, 0.5)
    const j = i << 2
    d[j] = s[j] * inv + c[0] * alpha
    d[j + 1] = s[j + 1] * inv + c[1] * alpha
    d[j + 2] = s[j + 2] * inv + c[2] * alpha
    d[j + 3] = 255
  }
  return out
}
