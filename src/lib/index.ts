import type { ImageSize, SceneType } from './interfaces'

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

export function getStartEndIndex(scene: SceneType, dialogues: SceneType[], sendStartIndex: number) {
  const start = scene.rangeStart === 0 ? sendStartIndex : scene.rangeStart ?? 0
  const end = scene.rangeEnd === 'end' ? dialogues.length : Number(scene.rangeEnd)
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
