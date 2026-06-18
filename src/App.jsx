import { useMemo, useState } from 'react'
import WebcamCapture from './components/WebcamCapture.jsx'
import StepViewer from './components/StepViewer.jsx'
import { buildGeometry } from './lib/fisheye.js'

export default function App() {
  // { imageData, largura, altura } da foto capturada
  const [captura, setCaptura] = useState(null)

  // geometria (distância/ângulo por pixel) calculada uma vez por foto
  const geom = useMemo(
    () => (captura ? buildGeometry(captura.largura, captura.altura) : null),
    [captura]
  )

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="titulo-bloco">
          <h1>Expandindo Mentes</h1>
          <p className="subtitulo">Autorretratos Distorcidos por Coordenadas Polares</p>
        </div>
      </header>

      <main className="conteudo">
        {!captura ? (
          <section className="intro">
            <p className="intro-texto">
              Tire uma foto com a webcam e descubra, <b>passo a passo</b>, como o algoritmo
              de <b>olho-de-peixe</b> transforma o seu rosto usando <b>coordenadas polares</b>.
            </p>
            <WebcamCapture onCapture={setCaptura} />
          </section>
        ) : (
          <StepViewer src={captura.imageData} geom={geom} onReiniciar={() => setCaptura(null)} />
        )}
      </main>

      <footer className="rodape">
        <span>Processamento de Imagens · ICMC-USP</span>
        <span>Feira de Extensão</span>
      </footer>
    </div>
  )
}
