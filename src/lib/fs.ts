import { readTextFile, writeTextFile } from '@tauri-apps/api/fs'
import type { Story } from './interfaces'
import { open, save } from '@tauri-apps/api/dialog'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import { changeApi } from './api'
import type { Char } from './charSettings'

export async function loadStory(path: string) {
  const json = await readTextFile(path)
  const story = JSON.parse(json) as Story
  changeApi(story.api)
  return story
}

export async function loadStoryDialog(): Promise<[Story|null, string]> {
  const selected = await open({ filters: [{ name: '*', extensions: ['json']}]})
  if (typeof(selected) === 'string' ) {
    return [await loadStory(selected), selected]
  }
  return [null, '']
}

async function readAsDataURL(blob:Blob): Promise<string|null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function loadImage():Promise<string|null> {
  const selected = await open({ filters: [{ name: '*', extensions: ['png', 'jpg']}]})
  if (typeof(selected) === 'string') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.responseType = 'blob'
      xhr.onload = () => resolve(readAsDataURL(xhr.response))
      xhr.onerror = reject
      xhr.open('GET', convertFileSrc(selected))
      xhr.send()
    })
  }
  return null
}

function dataURIToBlob(dataURI: string) {
  const byteString = atob(dataURI.split(",")[1])
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)

  for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i)
  }

  const blob = new Blob([uint8Array], { type: "image/png" })
  return blob
}

export function saveImageToFile(dataURI: string, filename: string) {
  const blob = dataURIToBlob(dataURI)

  const url = window.URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.style.display = "none"
  a.href = url
  a.download = filename

  document.body.appendChild(a)
  a.click()

  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export async function savePath(path: string, ext: string, data: any) {
  const filePath = await save({ defaultPath: path, filters: [{ name: '*', extensions: [ext] }] })
  if (filePath) {
    writeTextFile(filePath, JSON.stringify(data, null, 2))
  }
  return filePath
}

export async function saveStory(story: Story) {
  let fileName = story.title.replace(/[<>:"/\\|?*]/g, '_').trim()
  if (fileName === '') {
    fileName = 'story' + Date.now() + '.json'
  } else {
    fileName = fileName + '.json'
  }
  return savePath(fileName, 'story', story)
}

export async function saveObjQuietly(filePath: string, obj: Story|Char) {
  writeTextFile(filePath, JSON.stringify(obj, null, 2))
}