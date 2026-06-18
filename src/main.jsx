import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode propositalmente NÃO usado: em desenvolvimento ele monta os
// componentes duas vezes, o que faria a webcam ser pedida/parada/pedida de novo.
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
