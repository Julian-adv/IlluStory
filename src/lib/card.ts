import {
  allExts,
  basenameOf,
  charExt,
  extOf,
  jsonExt,
  lorebookExt,
  presetExt,
  sceneExt,
  sessionExt
} from './fs'
import { CardType, type StoryCard } from './interfaces'
import { defaultImage } from '$lib'
import { tcMetadata, tcOpen, tcReadTextFile } from './tauriCompat'
import { settings } from './store'
import { get } from 'svelte/store'

function cardTypeFromExt(ext: string) {
  switch (ext) {
    case presetExt:
      return CardType.Preset
    case charExt:
      return CardType.Char
    case sceneExt:
      return CardType.Scene
    case sessionExt:
      return CardType.Session
    case lorebookExt:
      return CardType.Lorebook
    case jsonExt:
      return CardType.Json
    default:
      throw new Error(`Unknown extension: ${ext}`)
  }
}

export async function cardFromPath(path: string): Promise<StoryCard> {
  const stat = await tcMetadata(path)
  let image = defaultImage
  let name = ''
  let title = ''
  if (stat.isDir) {
    return {
      type: CardType.Dir,
      name: basenameOf(path),
      title: title,
      path: path,
      modifiedAt: stat.modifiedAt,
      image: image
    }
  } else {
    const text = await tcReadTextFile(path)
    if (text) {
      const obj = JSON.parse(text)
      if (obj) {
        if (obj.image) {
          image = obj.image
        } else if (obj.prompts && obj.prompts.length > 0) {
          for (const prompt of obj.prompts) {
            if (prompt.image) {
              image = prompt.image
              break
            }
          }
        } else if (obj.length > 0) {
          for (const scene of obj) {
            if (scene.image) {
              image = scene.image
              break
            }
          }
        }
        if (obj.name) {
          name = obj.name
        } else {
          name = basenameOf(path)
        }
        if (obj.title && obj.title.toLowerCase() !== name.toLowerCase()) {
          title = obj.title
        }
      }
    }
    return {
      type: cardTypeFromExt(extOf(path)),
      name: name,
      title: title,
      path: path,
      modifiedAt: stat.modifiedAt,
      image: image
    }
  }
}

export async function loadCardDialog(exts: string[]): Promise<StoryCard | null> {
  const selected = await tcOpen({
    defaultPath: get(settings).dataDir,
    filters: [{ name: '*', extensions: exts }]
  })
  if (selected) {
    const ext = extOf(selected)
    if (allExts.includes(ext)) {
      return await cardFromPath(selected)
    }
  }
  return null
}
