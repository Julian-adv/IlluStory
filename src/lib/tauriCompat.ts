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
    console.log(result.entries)
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
  defaultPath: string
  filters: {
    name: string
    extensions: string[]
  }[]
}

export async function tcOpen(option: OpenOption) {
  const result = new Promise<string>((resolve, _reject) => {
    const input = document.getElementById('hiddenFileInput') as HTMLInputElement
    if (input) {
      input.accept = option.filters[0].extensions.map(ext => '.' + ext).join(' ')
      input.click()
      input.onchange = event => {
        if (event.target) {
          const target = event.target as HTMLInputElement
          if (target.files) {
            resolve(target.files[0].name)
          }
        }
      }
    }
  })
  return result
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
