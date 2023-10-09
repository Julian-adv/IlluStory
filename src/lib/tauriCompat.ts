import { convertFileSrc, invoke } from '@tauri-apps/api/tauri'
import {
  BaseDirectory,
  copyFile,
  createDir,
  exists,
  readDir,
  readTextFile,
  writeTextFile,
  type FileEntry
} from '@tauri-apps/api/fs'
import { appDataDir, resolveResource } from '@tauri-apps/api/path'
import { metadata } from 'tauri-plugin-fs-extra-api'
import { Body, getClient } from '@tauri-apps/api/http'
import { open, save, type SaveDialogOptions } from '@tauri-apps/api/dialog'
import { fileDialog } from './store'

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
  const json = await response.json()
  return json
}

export async function tcExists(path: string): Promise<boolean> {
  if (window.__TAURI_METADATA__) {
    return await exists(path, { dir: BaseDirectory.AppConfig })
  } else {
    const result = await fetchPost('fs/exists', { path: path })
    return result.exists
  }
}

export async function tcAppDataDir(): Promise<string> {
  if (window.__TAURI_METADATA__) {
    return await appDataDir()
  } else {
    const result = await fetchGet('fs/appDataDir')
    return result.path
  }
}

export async function tcCreateDir(path: string): Promise<void> {
  if (window.__TAURI_METADATA__) {
    await createDir(path, { dir: BaseDirectory.AppData, recursive: true })
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
    await copyFile(src, dest, { dir: BaseDirectory.AppData })
  } else {
    await fetchPost('fs/copyFile', { src: src, dest: dest })
  }
}

export async function tcReadTextFile(path: string): Promise<string> {
  if (window.__TAURI_METADATA__) {
    return await readTextFile(path, { dir: BaseDirectory.AppData })
  } else {
    const result = await fetchPost('fs/readTextFile', { path: path })
    return result.text
  }
}

export async function tcWriteTextFile(path: string, text: string): Promise<void> {
  if (window.__TAURI_METADATA__) {
    await writeTextFile(path, text, { dir: BaseDirectory.AppData })
  } else {
    await fetchPost('fs/writeTextFile', { path: path, text: text })
  }
}

export async function tcWriteBinaryFile(path: string, data: string): Promise<void> {
  await fetchPost('fs/writeBinaryFile', { path: path, text: data })
}

export async function tcReadDir(path: string): Promise<FileEntry[]> {
  if (window.__TAURI_METADATA__) {
    return await readDir(path, { dir: BaseDirectory.AppData, recursive: true })
  } else {
    const result = await fetchPost('fs/readDir', { path: path })
    return result.entries
  }
}

export async function tcMetadata(path: string) {
  if (window.__TAURI_METADATA__) {
    return await metadata(path)
  } else {
    const result = await fetchPost('fs/metadata', { path: path })
    return result
  }
}

interface OpenOption {
  defaultPath?: string
  import?: boolean
  filters: {
    name: string
    extensions: string[]
  }[]
}

async function openWithInputElement(ext: string): Promise<string> {
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

              reader.readAsText(selectedFile)
            }
          }
        }
      })
    }
  })
}

export async function tcOpen(option: OpenOption) {
  if (window.__TAURI_METADATA__) {
    return await open(option)
  } else {
    const ext = option.filters ? option.filters[0].extensions[0] : ''
    if (option.import) {
      return await openWithInputElement(ext)
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
    return await invoke('listFonts')
  } else {
    const result = await fetchGet('fonts/list')
    return result.fonts
  }
}

export async function tcPost(url: string, body: any) {
  if (window.__TAURI_METADATA__) {
    const client = await getClient()
    return await client.post(url, Body.json(body), {
      headers: { 'Content-Type': 'application/json' }
    })
  } else {
    const result = await fetchPost('request/post', { url: url, body: body })
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
