import type { Preset, Char, FirstScene, Session, Lorebook } from './interfaces'
import { readMetadata } from 'png-metadata-writer'
import {
  tcConvertFileSrc,
  tcCopyFile,
  tcCreateDir,
  tcExists,
  tcOpen,
  tcResolveResource,
  tcSave,
  tcSetDataDir,
  tcWriteBinaryFile,
  tcWriteTextFile
} from './tauriCompat'

export async function loadImage(): Promise<string | null> {
  return await tcOpen({
    mode: 'image',
    filters: [{ name: '*', extensions: ['png', 'jpg'] }]
  })
}

function dataURIToBlob(dataURI: string) {
  const byteString = atob(dataURI.split(',')[1])
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }

  const blob = new Blob([uint8Array], { type: 'image/png' })
  return blob
}

export function saveImageToFile(dataURI: string, filename: string) {
  tcWriteBinaryFile(filename, dataURI)
}

export function saveImageToFileOrg(dataURI: string, filename: string) {
  const blob = dataURIToBlob(dataURI)

  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename

  document.body.appendChild(a)
  a.click()

  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function savePath(path: string, ext: string, data: any) {
  const filePath = await tcSave({ defaultPath: path, filters: [{ name: '*', extensions: [ext] }] })
  if (filePath) {
    tcWriteTextFile(filePath, JSON.stringify(data, null, 2))
  }
  return filePath
}

export async function savePreset(preset: Preset) {
  let fileName = preset.title.replace(/[<>:"/\\|?*]/g, '_').trim()
  if (fileName === '') {
    fileName = 'preset' + Date.now()
  }
  fileName += '.' + presetExt
  return savePath(fileName, presetExt, preset)
}

export async function saveObjQuietly(
  filePath: string,
  obj: Preset | Char | FirstScene | Session | Lorebook
) {
  await tcWriteTextFile(filePath, JSON.stringify(obj, null, 2))
}

export const presetExt = 'preset'
export const sessionExt = 'session'
export const charExt = 'char'
export const sceneExt = 'scene'
export const lorebookExt = 'lorebook'
export const jsonExt = 'json'
export const allExts = [presetExt, sessionExt, charExt, sceneExt, lorebookExt]

export const settingsFile = 'settings.json'

export function basenameOf(path: string) {
  path = path.replace(/\\/g, '/')
  let endIndex = path.lastIndexOf('.')
  if (endIndex < 0) {
    endIndex = path.length
  }
  let startIndex = path.lastIndexOf('/')
  if (startIndex < 0) {
    startIndex = -1
  }
  return path.slice(startIndex + 1, endIndex)
}

export function extOf(path: string) {
  const index = path.lastIndexOf('.')
  if (index < 0) {
    return ''
  }
  return path.slice(index + 1)
}

export function dirnameOf(path: string) {
  const correctedPath = path.replace(/\\/g, '/')
  const lastSlashIndex = correctedPath.lastIndexOf('/')
  if (lastSlashIndex === -1) return ''
  return correctedPath.substring(0, lastSlashIndex)
}

function loadFileAsBlob(path: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'blob'
    xhr.onload = () => resolve(xhr.response)
    xhr.onerror = reject
    xhr.open('GET', tcConvertFileSrc(path))
    xhr.send()
  })
}

export async function loadMetaData(path: string) {
  const blob = await loadFileAsBlob(path)
  const buffer = await blob.arrayBuffer()
  return readMetadata(new Uint8Array(buffer))
}

export async function installDefaults() {
  // const filesToCopy = ['default.preset', 'Julian.char', 'Eliane.char', "Adventurer's Guild.scene"]
  // await tcSetDataDir()
  // if (await tcExists(filesToCopy[0])) {
  //   return
  // }
  // if (!(await tcExists(''))) {
  //   await tcCreateDir('')
  // }
  // for (const file of filesToCopy) {
  //   const filePath = await tcResolveResource('resources/' + file)
  //   tcCopyFile(filePath, file)
  // }
}
