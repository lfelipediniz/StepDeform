// ============================================================================
//  highlight.js — realce de sintaxe (Python) bem leve, sem dependências.
//  Recebe uma linha de código e devolve uma lista de tokens { text, type }.
//  Os "type" viram classes CSS (.tok-keyword, .tok-function, ...) no StepViewer.
// ============================================================================

const KEYWORDS = new Set([
  'def', 'return', 'for', 'in', 'if', 'elif', 'else', 'while', 'import',
  'from', 'as', 'and', 'or', 'not', 'is', 'None', 'True', 'False', 'lambda',
  'with', 'class', 'pass', 'break', 'continue', 'yield', 'global', 'try',
  'except', 'finally', 'raise',
])

// nomes que queremos destacar como "biblioteca" (ex.: np de numpy)
const BUILTINS = new Set(['np', 'self', 'len', 'range', 'print'])

const ESPACO = (c) => c === ' ' || c === '\t'
const DIGITO = (c) => c >= '0' && c <= '9'
const INICIO_ID = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
const MEIO_ID = (c) => INICIO_ID(c) || DIGITO(c)
const OP = (c) => '+-*/=<>%&|^~'.includes(c)

export function tokenizePython(line) {
  const tokens = []
  const push = (text, type) => text && tokens.push({ text, type })
  let i = 0
  const n = line.length
  let prev = '' // último token relevante (ignora espaços) — usado p/ achar o nome após "def"

  while (i < n) {
    const c = line[i]

    // espaços (preservam a indentação)
    if (ESPACO(c)) {
      let j = i
      while (j < n && ESPACO(line[j])) j++
      push(line.slice(i, j), 'space')
      i = j
      continue
    }

    // comentário: do # até o fim da linha
    if (c === '#') {
      push(line.slice(i), 'comment')
      break
    }

    // string entre aspas simples ou duplas
    if (c === '"' || c === "'") {
      const q = c
      let j = i + 1
      while (j < n && line[j] !== q) {
        if (line[j] === '\\') j++
        j++
      }
      j = Math.min(j + 1, n)
      push(line.slice(i, j), 'string')
      i = j
      prev = 'string'
      continue
    }

    // número (inteiro ou decimal)
    if (DIGITO(c)) {
      let j = i
      while (j < n && (DIGITO(line[j]) || line[j] === '.')) j++
      push(line.slice(i, j), 'number')
      i = j
      prev = 'number'
      continue
    }

    // identificador / palavra-chave / função
    if (INICIO_ID(c)) {
      let j = i
      while (j < n && MEIO_ID(line[j])) j++
      const word = line.slice(i, j)
      // o próximo caractere não-espaço é "(" ? então é uma chamada de função
      let k = j
      while (k < n && ESPACO(line[k])) k++
      const ehChamada = line[k] === '('

      let type = 'name'
      if (KEYWORDS.has(word)) type = 'keyword'
      else if (prev === 'def') type = 'function' // nome logo após "def"
      else if (ehChamada) type = 'function'
      else if (BUILTINS.has(word)) type = 'builtin'

      push(word, type)
      i = j
      prev = word
      continue
    }

    // operadores ( = ** * / + - etc.)
    if (OP(c)) {
      let j = i
      while (j < n && OP(line[j])) j++
      push(line.slice(i, j), 'operator')
      prev = line.slice(i, j)
      i = j
      continue
    }

    // demais pontuações: ( ) [ ] { } , : .
    push(c, 'punct')
    prev = c
    i++
  }

  // linha vazia: devolve um espaço para manter a altura da linha
  if (tokens.length === 0) tokens.push({ text: ' ', type: 'space' })
  return tokens
}
