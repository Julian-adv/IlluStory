import { fileDialog, sessionPath, settings } from './store'
import { get } from 'svelte/store'
import type { FileEntry, SaveDialogOptions } from './interfaces'

export async function tcSetDataDir() {
  if (get(settings).dataDir) {
    return
  }
  let dataDirectory = ''
  const result = await fetchGet('fs/appDataDir')
  dataDirectory = result.path.replaceAll('\\', '/')
  get(settings).dataDir = dataDirectory
}

async function fetchGet(api: string) {
  const response = await fetch('http://localhost:8001/api/' + api, {
    method: 'GET'
  })
  const json = await response.json()
  return json
}

async function fetchPost(api: string, body: any) {
  const response = await fetch('http://localhost:8001/api/' + api, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.status != 204) {
    const json = await response.json()
    return json
  } else {
    return {}
  }
}

export async function tcExists(path: string): Promise<boolean> {
  path = get(settings).dataDir + '/' + path
  const result = await fetchPost('fs/exists', { path: path })
  return result.exists
}

export async function tcCreateDir(path: string): Promise<void> {
  path = get(settings).dataDir + '/' + path
  await fetchPost('fs/createDir', { path: path })
}

export async function tcResolveResource(path: string): Promise<string> {
  const result = await fetchPost('fs/resolveResource', { path: path })
  return result.path
}

export async function tcCopyFile(src: string, dest: string): Promise<void> {
  await fetchPost('fs/copyFile', { src: src, dest: dest })
}

function isAbsolute(path: string) {
  return /^(?:[a-zA-Z]:|\/|\\)/.test(path)
}

export async function tcReadTextFile(path: string): Promise<string> {
  if (!isAbsolute(path)) {
    path = get(settings).dataDir + '/' + path
  }
  const result = await fetchPost('fs/readTextFile', { path: path })
  return result.text
}

export async function tcReadBinaryFile(path: string): Promise<Uint8Array> {
  if (!isAbsolute(path)) {
    path = get(settings).dataDir + '/' + path
  }
  const result = await fetchPost('fs/readBinaryFile', { path: path })
  return result.data
}

export async function tcWriteTextFile(path: string, text: string): Promise<void> {
  if (!isAbsolute(path)) {
    path = get(settings).dataDir + '/' + path
  }
  await fetchPost('fs/writeTextFile', { path: path, text: text })
}

export async function tcWriteBinaryFile(path: string, data: string): Promise<void> {
  if (!isAbsolute(path)) {
    path = get(settings).dataDir + '/' + path
  }
  await fetchPost('fs/writeBinaryFile', { path: path, text: data })
}

export async function tcReadDir(path: string): Promise<FileEntry[]> {
  if (!isAbsolute(path)) {
    path = get(settings).dataDir + '/' + path
  }
  const result = await fetchPost('fs/readDir', { path: path })
  return result.entries
}

export async function tcMetadata(path: string) {
  if (!isAbsolute(path)) {
    path = get(settings).dataDir + '/' + path
  }
  const result = await fetchPost('fs/metadata', { path: path })
  return result
}

interface OpenOption {
  defaultPath?: string
  mode?: 'text' | 'binary' | 'image'
  filters: {
    name: string
    extensions: string[]
  }[]
}

async function openWithInputElement(ext: string, mode: string): Promise<string> {
  return new Promise((resolve, _reject) => {
    const elem = document.getElementById('fileInput')

    if (elem) {
      const fileInput = elem as HTMLInputElement
      fileInput.accept = '.' + ext
      fileInput.click()
      fileInput.addEventListener('change', event => {
        if (event.target) {
          const target = event.target as HTMLInputElement
          if (target.files) {
            const selectedFile = target.files[0]

            if (selectedFile) {
              const reader = new FileReader()

              reader.onload = function (event) {
                if (typeof event.target?.result === 'string') {
                  resolve(event.target.result)
                }
              }

              if (mode === 'text') {
                reader.readAsText(selectedFile)
              } else {
                reader.readAsDataURL(selectedFile)
              }
            }
          }
        }
      })
    }
  })
}

export async function tcOpen(option: OpenOption): Promise<string> {
  const ext = option.filters ? option.filters[0].extensions[0] : ''
  if (option.mode) {
    return await openWithInputElement(ext, option.mode)
  } else {
    const value = option.defaultPath ? option.defaultPath : ''
    fileDialog.set({ open: true, value: value, ext: ext, title: 'Open' })
    return new Promise<string>((resolve, _reject) => {
      const unsub = fileDialog.subscribe(dialog => {
        if (!dialog.open) {
          resolve(dialog.value)
          unsub()
        }
      })
    })
  }
}

export async function tcSave(option: SaveDialogOptions) {
  const ext = option.filters ? option.filters[0].extensions[0] : ''
  const value = option.defaultPath ? option.defaultPath : ''
  fileDialog.set({ open: true, value: value, ext: ext, title: 'Save' })
  return new Promise<string>((resolve, _reject) => {
    const unsub = fileDialog.subscribe(dialog => {
      if (!dialog.open) {
        resolve(dialog.value)
        unsub()
      }
    })
  })
}

export async function tcListFonts(): Promise<string[]> {
  const result = await fetchGet('fonts/list')
  return result.fonts
}

export async function tcPost(url: string, body: any, headers?: any) {
  const result = await fetchPost('request/post', {
    url: url,
    body: body,
    headers: headers ?? { 'Content-Type': 'application/json' }
  })
  return result
}

export async function tcGet(url: string, headers?: any) {
  const result = await fetchPost('request/get', {
    url: url,
    body: {},
    headers: headers ?? { 'Content-Type': 'application/json' }
  })
  return result
}

export function tcConvertFileSrc(path: string) {
  return path.replace('\\', '/')
}

function splitText(text: string) {
  const textEllipsis = text.replaceAll('...', '<ellipsis>')
  const pattern = /(".+?[.!?]"|"[^"]+"[^"]+?[.!?]|[^.!?]+?".+?[.!?]"|.+?[.!?])\s*/g
  let match
  const sentences = []

  while ((match = pattern.exec(textEllipsis)) !== null) {
    sentences.push(match[1])
  }

  if (sentences.length === 0) {
    return [text]
  }

  return sentences.map(sentence => sentence.replaceAll('<ellipsis>', '...'))
}

function combineSentences(sentences: string[], n: number) {
  const combined = []
  for (let i = 0; i < sentences.length - n; i += n) {
    combined.push(sentences.slice(i, i + n).join(' '))
  }
  return combined
}

async function getEmbeddings(sentences: string[]) {
  const embeddings = []
  for (const sentence of sentences) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + get(settings).openAiApiKey
      },
      method: 'POST',
      body: JSON.stringify({ input: sentence, model: 'text-embedding-ada-002' })
    })
    const json = await response.json()
    embeddings.push(json.data[0].embedding)
  }
  return embeddings
}

export async function tcSaveMemory(collection: string, doc: string, meta: any, id: string) {
  tcLog('INFO', 'save memory', id, doc, JSON.stringify(meta))
  if (get(settings).embeddings === 'ada-002') {
    const sentences = splitText(doc)
    const combined = combineSentences(sentences, 2)
    const embeddings = await getEmbeddings(combined)
    const result = await fetchPost('memory/save_embeddings', {
      collection: collection,
      embeddings: embeddings,
      docs: combined,
      meta: meta,
      id: id
    })
    return result
  } else {
    const result = await fetchPost('memory/save', {
      collection: collection,
      doc: doc,
      meta: meta,
      id: id
    })
    return result
  }
}

export async function tcGetMemory(collection: string, text: string, n: number) {
  if (get(settings).embeddings === 'ada-002') {
    const embeddings = await getEmbeddings([text])
    const result = await fetchPost('memory/get_embeddings', {
      collection: collection,
      embeddings: embeddings,
      n: n
    })
    return result
  } else {
    const result = await fetchPost('memory/get', { collection: collection, text: text, n: n })
    return result
  }
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
export async function tcLog(level: LogLevel, ...messages: string[]) {
  const path = get(sessionPath)
  const dataDir = get(settings).dataDir
  let logPath = ''
  if (path && dataDir) {
    logPath = dataDir + '/' + path.replace('.session', '.log')
  } else if (dataDir) {
    logPath = dataDir + '/illustory.log'
  } else {
    console.log(messages.join(' '))
    return
  }
  await fetchPost('log', { path: logPath, level: level, msg: messages.join(' ') })
}

export function tcConvertImageSrc(src: string | undefined) {
  return 'http://localhost:8001/static/' + src
}

export async function tcGetComfyImage(
  serverAddr: string,
  model: string,
  width: number,
  height: number,
  prompt: string,
  negativePrompt: string,
  steps: number,
  cfg: number,
  ipWeight: number
) {
  return await fetchPost('gen_image/comfy', {
    server_address: serverAddr,
    model: model,
    width: width,
    height: height,
    prompt: prompt,
    negative_prompt: negativePrompt,
    steps: steps,
    cfg: cfg,
    ip_weight: ipWeight
  })
}
