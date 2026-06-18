// ============================================================================
//  steps.js - roteiro do passo a passo.
//  Cada etapa aponta para as linhas do código que ela executa (para destacar),
//  traz um texto explicativo e define o "modo" de visualização + a força-alvo.
// ============================================================================

// O código exato do pôster, linha a linha (o índice é usado para destacar).
export const CODIGO = [
  'def olho_de_peixe(imagem, forca_do_efeito=1.8):',                                   // 0
  '    altura, largura = imagem.shape[:2]',                                            // 1
  '    pos_y, pos_x = np.indices((altura, largura))',                                  // 2
  '',                                                                                  // 3
  '    # 1. Move a referência (0,0) para o meio da tela',                             // 4
  '    x_centralizado = (2 * pos_x / largura) - 1',                                   // 5
  '    y_centralizado = (2 * pos_y / altura) - 1',                                    // 6
  '',                                                                                  // 7
  '    # 2. Mede a distância e o ângulo de cada pixel até o meio',                    // 8
  '    distancia_centro = np.sqrt(x_centralizado**2 + y_centralizado**2)',            // 9
  '    angulo = np.arctan2(y_centralizado, x_centralizado)',                          // 10
  '',                                                                                  // 11
  '    # 3. A magica: entorta a distancia criando o "cabecao"',                       // 12
  '    distancia_distorcida = distancia_centro ** forca_do_efeito',                   // 13
  '',                                                                                  // 14
  '    # 4. Traduz de volta para posicoes normais na tela',                           // 15
  '    novo_x = np.clip(((distancia_distorcida * np.cos(angulo) + 1) * largura / 2), 0, largura-1).astype(int)', // 16
  '    novo_y = np.clip(((distancia_distorcida * np.sin(angulo) + 1) * altura / 2), 0, altura-1).astype(int)',   // 17
  '',                                                                                  // 18
  '    # Puxa os pixels da imagem original para suas novas posicoes',                 // 19
  '    return imagem[novo_y, novo_x]',                                                 // 20
]

export const STEPS = [
  {
    id: 'original',
    rotulo: 'Original',
    titulo: 'Imagem original',
    modo: 'original',
    forcaAlvo: 1.0,
    linhas: [0, 1, 2],
    explicacao:
      'Esta é a foto que acabamos de capturar. O algoritmo vai decidir, para CADA pixel da imagem final, de qual posição da foto original ele deve "puxar" a cor. Use a seta ▶ (ou as setas do teclado) para avançar.',
  },
  {
    id: 'grid',
    rotulo: 'Coordenadas',
    titulo: 'Passo 1 · Centralizar as coordenadas',
    modo: 'grid',
    forcaAlvo: 1.0,
    linhas: [4, 5, 6],
    explicacao:
      'Normalmente o pixel (0,0) fica no canto superior esquerdo. Aqui movemos a origem para o CENTRO da imagem e colocamos tudo numa escala de -1 a +1. Assim o meio do rosto vira o ponto (0,0) - o eixo em torno do qual tudo vai girar e esticar.',
  },
  {
    id: 'distance',
    rotulo: 'Distância',
    titulo: 'Passo 2 · Distância até o centro',
    modo: 'distance',
    forcaAlvo: 1.0,
    linhas: [8, 9],
    explicacao:
      'Para cada pixel, medimos a distância até o centro usando Pitágoras (raiz de x² + y²). No mapa de calor: o centro é quente (perto) e as bordas são frias (longe). É essa distância que vamos "entortar" mais adiante.',
  },
  {
    id: 'angle',
    rotulo: 'Ângulo',
    titulo: 'Passo 3 · Ângulo de cada pixel',
    modo: 'angle',
    forcaAlvo: 1.0,
    linhas: [10],
    explicacao:
      'Também guardamos o ângulo de cada pixel em relação ao centro (arctan2). Cada cor representa uma direção. Distância + ângulo = COORDENADAS POLARES: a forma natural de descrever giros e estiramentos em torno de um ponto.',
  },
  {
    id: 'distort',
    rotulo: 'A mágica',
    titulo: 'Passo 4 · A mágica: distorcer a distância',
    modo: 'distort',
    forcaAlvo: 1.8,
    linhas: [12, 13],
    explicacao:
      'Elevamos a distância à potência da força (1.8). Como a força é maior que 1, as distâncias perto do centro ENCOLHEM - então cada ponto passa a puxar cor de um lugar mais próximo do meio, e o centro "incha", criando o cabeção. Veja a foto se transformando: a força sai de 1.0 (sem efeito) e cresce até 1.8.',
  },
  {
    id: 'remap',
    rotulo: 'Remapear',
    titulo: 'Passo 5 · Voltar para a tela',
    modo: 'remap',
    forcaAlvo: 1.8,
    linhas: [15, 16, 17],
    explicacao:
      'Com a nova distância e o ângulo, convertemos de volta para coordenadas de pixel (novo_x, novo_y). As setas mostram de onde cada pixel veio. O np.clip garante que nada saia para fora da imagem.',
  },
  {
    id: 'result',
    rotulo: 'Resultado',
    titulo: 'Resultado final',
    modo: 'result',
    forcaAlvo: 1.8,
    linhas: [19, 20],
    explicacao:
      'Por fim, cada pixel recebe a cor da posição calculada: imagem[novo_y, novo_x]. Pronto, o autorretrato distorcido! Mexa no controle de força para ver o efeito ficar mais suave ou mais extremo.',
  },
]
