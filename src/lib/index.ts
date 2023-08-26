import type { SceneType } from "./interfaces"

export const helperClassVisible = "text-stone-700"
export const helperClassHidden = "text-stone-400"
export const linkClassVisible = "text-sky-600"

export function newSceneId(initialScenes:SceneType[], additionalScenes:SceneType[]):number {
  if (additionalScenes.length > 0) {
    return additionalScenes[additionalScenes.length - 1].id + 1
  }
  if (initialScenes.length > 0) {
    return initialScenes[initialScenes.length - 1].id + 1
  }
  return 1
}

export function lastScene(scenes:SceneType[]):SceneType {
  return scenes[scenes.length - 1]
}

export function countLines(str: string): number {
  let count = 1
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\n") {
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
