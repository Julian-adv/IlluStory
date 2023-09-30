import { invoke } from '@tauri-apps/api/tauri'
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

export async function tcReadDir(path: string): Promise<FileEntry[]> {
  if (window.__TAURI_METADATA__) {
    return await readDir(path, { dir: BaseDirectory.AppData, recursive: true })
  } else {
    const result = await fetchPost('fs/readDir', { path: path })
    console.log('entries', result.entries)
    return result.entries
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
