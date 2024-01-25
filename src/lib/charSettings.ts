import { open } from '@tauri-apps/api/dialog'
import { charExt, loadMetaData, savePath } from './fs'
import type { Char } from './interfaces'
import { tcLog, tcOpen, tcReadTextFile } from './tauriCompat'

export async function loadChar(path: string) {
  const json = await tcReadTextFile(path)
  const char = JSON.parse(json) as Char
  return char
}

export async function loadCharDialog(): Promise<[Char | null, string]> {
  const selected = await tcOpen({ filters: [{ name: '*', extensions: [charExt] }] })
  if (typeof selected === 'string') {
    return [await loadChar(selected), selected]
  }
  return [null, '']
}

export async function loadMetaDataDialog() {
  const selected = await open({ filters: [{ name: '*', extensions: ['png'] }] })
  if (typeof selected === 'string') {
    return await loadMetaData(selected)
  }
}

export async function saveChar(char: Char) {
  let fileName = char.name.replace(/[<>:"/\\|?*]/g, '_').trim()
  if (fileName === '') {
    fileName = 'char' + Date.now()
  }
  fileName += '.' + charExt
  return savePath(fileName, charExt, char)
}
