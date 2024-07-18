import { get } from 'svelte/store'
import type { Char } from './interfaces'
import type { ChatHistoryPrompt, ImageSize, SceneType } from './promptInterface'
import { settings } from './store'
import { tcPost } from './tauriCompat'

export const helperClassVisible = 'text-stone-700'
export const helperClassHidden = 'text-stone-400'
export const linkClassVisible = 'text-sky-600'

export const defaultImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII='

export function newSceneId(dialogues: SceneType[]): number {
  if (dialogues.length > 0) {
    return dialogues[dialogues.length - 1].id + 1
  }
  return 1
}

export function lastScene(scenes: SceneType[]): SceneType {
  return scenes[scenes.length - 1]
}

export function findLastScene(scenes: SceneType[], role: string): SceneType {
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (scenes[i].role === role) {
      return scenes[i]
    }
  }
  return scenes[0]
}

export function countLines(str: string): number {
  let count = 1
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\n') {
      count++
    }
  }
  if (count < 4) {
    count = 4
  }
  if (count > 15) {
    count = 15
  }
  return count
}

let sequence = 0

export function getUniqueId() {
  return 'id' + sequence++
}

export function scrollToEnd() {
  window.scrollTo(0, document.body.scrollHeight)
}

export function realImageSize(imageSize: number) {
  return imageSize / window.devicePixelRatio
}

export function removeCommonPrefix(a: string, b: string): string {
  let i = 0

  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++
  }

  return b.slice(i)
}

export function translateButtonClass(translated: boolean) {
  return translated ? 'text-sky-700 focus:text-sky-700' : 'text-stone-400 focus:text-stone-400'
}

export function getRandomSize(sizes: string): ImageSize {
  const sizeArray = sizes.split(',')
  const randomSize = sizeArray[Math.floor(Math.random() * sizeArray.length)]
  const [width, height] = randomSize.split('x').map(Number)

  return { width, height }
}

export function getStartEndIndex(
  scene: ChatHistoryPrompt,
  dialogues: SceneType[],
  streaming: boolean
) {
  let start = scene.rangeStart ?? 0
  let end = scene.rangeEnd === 'end' ? length : Number(scene.rangeEnd)
  if (streaming) {
    if (start < 0) {
      start--
    }
    end--
  }

  return { start, end }
}

export function decodeBase64(base64: string) {
  const text = atob(base64)
  const length = text.length
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = text.charCodeAt(i)
  }
  const decoder = new TextDecoder() // default is utf-8
  return decoder.decode(bytes)
}

export function normalizePath(path: string) {
  return path.replaceAll('\\', '/').replace(get(settings).dataDir + '/', '')
}

export async function killServer() {
  try {
    await tcPost('http://localhost:8001/api/process/kill', { dummy: 0 })
  } catch {
    // ignore
  }
}

export function labelColor(
  value: number | boolean | string | number[],
  defaultValue: number | boolean | string | number[]
) {
  if (
    Array.isArray(value) &&
    Array.isArray(defaultValue) &&
    value.length === defaultValue.length &&
    value.every((v, i) => v === defaultValue[i])
  ) {
    return 'text-black'
  }
  return value !== defaultValue ? 'text-blue-700' : 'text-black'
}

export function iconForName(chars: Char[], user: Char, name: string | undefined): string {
  for (const ch of chars) {
    if (ch.name === name) {
      return ch.image
    }
  }
  if (user.name === name) {
    return user.image
  }
  return ''
}

export function chooseCharByName(chars: Char[], user: Char, name: string): Char {
  for (const ch of chars) {
    if (ch.name === name) {
      return ch
    }
  }
  if (user.name === name) {
    return user
  }
  return chars[0]
}

export function newScene(
  id: number,
  role: 'assistant' | 'user',
  speaker: string,
  content: string,
  done: boolean,
  isDialogueOnly = false
): SceneType {
  return {
    id: id,
    role: role,
    content: content,
    image: '',
    imageSize: { width: 0, height: 0 },
    done: done,
    name: speaker,
    visualContent: '',
    textContent: content,
    translatedContent: '',
    isDialogueOnly: isDialogueOnly
  }
}
