import { convertFileSrc, invoke } from '@tauri-apps/api/tauri'
import {
  copyFile,
  createDir,
  exists,
  readDir,
  readTextFile,
  writeTextFile,
  type FileEntry
} from '@tauri-apps/api/fs'
import { homeDir, resolveResource } from '@tauri-apps/api/path'
import { metadata } from 'tauri-plugin-fs-extra-api'
import { Body, getClient } from '@tauri-apps/api/http'
import { open, save, type SaveDialogOptions } from '@tauri-apps/api/dialog'
import { fileDialog, sessionPath, settings } from './store'
import { get } from 'svelte/store'
import { normalizePath } from '$lib'

export async function tcSetDataDir() {
  if (get(settings).dataDir) {
    return
  }
  let dataDirectory = ''
  if (window.__TAURI_METADATA__) {
    dataDirectory = await homeDir()
  } else {
    const result = await fetchGet('fs/homeDir')
    dataDirectory = result.path
  }
  dataDirectory = dataDirectory.replace(/\\/g, '/') + 'IlluStory'
  get(settings).dataDir = dataDirectory
}

async function fetchGet(api: string) {
  const response = await fetch('http://localhost:8000/api/' + api, {
    method: 'GET'
  })
  const json = await response.json()
  return json
}

async function fetchPost(api: string, body: any) {
  const response = await fetch('http://localhost:8000/api/' + api, {
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
  if (window.__TAURI_METADATA__) {
    path = get(settings).dataDir + '/' + path
    return await exists(path)
  } else {
    const result = await fetchPost('fs/exists', { path: path })
    return result.exists
  }
}

export async function tcAppDataDir(): Promise<string> {
  if (window.__TAURI_METADATA__) {
    return ''
  } else {
    const result = await fetchGet('fs/appDataDir')
    return result.path
  }
}

export async function tcCreateDir(path: string): Promise<void> {
  if (window.__TAURI_METADATA__) {
    path = get(settings).dataDir + '/' + path
    await createDir(path, { recursive: true })
  } else {
    await fetchPost('fs/createDir', { path: path })
  }
}

export async function tcResolveResource(path: string): Promise<string> {
  if (window.__TAURI_METADATA__) {
    return await resolveResource(path)
  } else {
    const result = await fetchPost('fs/resolveResource', { path: path })
    return result.path
  }
}

export async function tcCopyFile(src: string, dest: string): Promise<void> {
  if (window.__TAURI_METADATA__) {
    dest = get(settings).dataDir + '/' + dest
    await copyFile(src, dest)
  } else {
    await fetchPost('fs/copyFile', { src: src, dest: dest })
  }
}

function isAbsolute(path: string) {
  return /^(?:[a-zA-Z]:|\/|\\)/.test(path)
}

export async function tcReadTextFile(path: string): Promise<string> {
  if (window.__TAURI_METADATA__) {
    if (!isAbsolute(path)) {
      path = get(settings).dataDir + '/' + path
    }
    return await readTextFile(path)
  } else {
    const result = await fetchPost('fs/readTextFile', { path: path })
    return result.text
  }
}

export async function tcWriteTextFile(path: string, text: string): Promise<void> {
  if (window.__TAURI_METADATA__) {
    if (!isAbsolute(path)) {
      path = get(settings).dataDir + '/' + path
    }
    await writeTextFile(path, text)
  } else {
    await fetchPost('fs/writeTextFile', { path: path, text: text })
  }
}

export async function tcWriteBinaryFile(path: string, data: string): Promise<void> {
  await fetchPost('fs/writeBinaryFile', { path: path, text: data })
}

export async function tcReadDir(path: string): Promise<FileEntry[]> {
  if (window.__TAURI_METADATA__) {
    path = get(settings).dataDir + '/' + path
    return await readDir(path, { recursive: true })
  } else {
    const result = await fetchPost('fs/readDir', { path: path })
    return result.entries
  }
}

export async function tcMetadata(path: string) {
  if (window.__TAURI_METADATA__) {
    return await metadata(get(settings).dataDir + '/' + path)
  } else {
    const result = await fetchPost('fs/metadata', { path: path })
    return result
  }
}

interface OpenOption {
  defaultPath?: string
  mode?: 'text' | 'image'
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

async function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function tcOpen(option: OpenOption): Promise<string> {
  if (window.__TAURI_METADATA__) {
    const path = await open(option)
    if (typeof path === 'string' && path) {
      if (option.mode === 'text') {
        return await tcReadTextFile(path)
      } else if (option.mode === 'image') {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.responseType = 'blob'
          xhr.onload = () => resolve(readAsDataURL(xhr.response))
          xhr.onerror = reject
          xhr.open('GET', convertFileSrc(path))
          xhr.send()
        })
      } else {
        return normalizePath(path)
      }
    } else {
      return ''
    }
  } else {
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
}

export async function tcSave(option: SaveDialogOptions) {
  if (window.__TAURI_METADATA__) {
    return await save(option)
  } else {
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
}

export async function tcListFonts(): Promise<string[]> {
  if (window.__TAURI_METADATA__) {
    return await invoke('list_fonts')
  } else {
    const result = await fetchGet('fonts/list')
    return result.fonts
  }
}

export async function tcPost(url: string, body: any, headers?: any) {
  if (window.__TAURI_METADATA__) {
    const client = await getClient()
    return await client.post(url, Body.json(body), {
      headers: headers ?? { 'Content-Type': 'application/json' }
    })
  } else {
    const result = await fetchPost('request/post', {
      url: url,
      body: body,
      headers: headers ?? { 'Content-Type': 'application/json' }
    })
    return result
  }
}

export function tcConvertFileSrc(path: string) {
  if (window.__TAURI_METADATA__) {
    return convertFileSrc(path)
  } else {
    return path.replace('\\', '/')
  }
}

export async function tcSaveMemory(collection: string, doc: string, meta: any, id: string) {
  // tcLog('INFO', 'save memory', id, doc, JSON.stringify(meta))
  const result = await fetchPost('memory/save', {
    collection: collection,
    doc: doc,
    meta: meta,
    id: id
  })
  return result
}

export async function tcGetMemory(collection: string, text: string, n: number) {
  const result = await fetchPost('memory/get', { collection: collection, text: text, n: n })
  // tcLog('INFO', 'get memory', text, String(n), JSON.stringify(result))
  return result
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
  if (window.__TAURI_METADATA__) {
    await invoke('log', { path: logPath, level: level, msg: messages.join(' ') })
  } else {
    await fetchPost('log', { path: logPath, level: level, msg: messages.join(' ') })
  }
}

export function tcConvertImageSrc(src: string | undefined) {
  if (window.__TAURI_METADATA__) {
    return convertFileSrc(get(settings).dataDir + '/' + src)
  } else {
    return 'http://localhost:8000/api/' + src
  }
}
