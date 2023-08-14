import { readTextFile } from "@tauri-apps/api/fs"
import { open } from '@tauri-apps/api/dialog'
import { savePath } from "./fs"
import type { Char } from "./interfaces"

export async function loadChar(path: string) {
  const json = await readTextFile(path)
  const char = JSON.parse(json) as Char
  return char
}

export async function loadCharDialog(): Promise<[Char|null, string]> {
  const selected = await open({ filters: [{ name: '*', extensions: ['char']}]})
  if (typeof(selected) === 'string' ) {
    return [await loadChar(selected), selected]
  }
  return [null, '']
}

export async function saveChar(char: Char) {
  let fileName = char.name.replace(/[<>:"/\\|?*]/g, '_').trim()
  if (fileName === '') {
    fileName = 'char' + Date.now() + '.char'
  } else {
    fileName = fileName + '.char'
  }
  return savePath(fileName, 'char', char)
}