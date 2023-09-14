import { readTextFile } from '@tauri-apps/api/fs'
import { allExts, basenameOf, charExt, extOf, presetExt, sceneExt, sessionExt } from './fs'
import { CardType, type StoryCard } from './interfaces'
import { open } from '@tauri-apps/api/dialog'
import { defaultImage } from '$lib'
import { metadata } from 'tauri-plugin-fs-extra-api'

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
    default:
      throw new Error(`Unknown extension: ${ext}`)
  }
}

export async function cardFromPath(path: string): Promise<StoryCard> {
  const text = await readTextFile(path)
  const obj = JSON.parse(text)
  let image = defaultImage
  let name = basenameOf(path)
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
    if (obj.title) {
      name = obj.title
    } else if (obj.name) {
      name = obj.name
    }
  }
  const stat = await metadata(path)
  return {
    type: cardTypeFromExt(extOf(path)),
    name: name,
    path: path,
    modifiedAt: stat.modifiedAt,
    image: image
  }
}

export async function loadCardDialog(exts: string[]): Promise<StoryCard | null> {
  const selected = await open({
    filters: [{ name: '*', extensions: exts }]
  })
  if (typeof selected === 'string') {
    const ext = extOf(selected)
    if (allExts.includes(ext)) {
      return await cardFromPath(selected)
    }
  }
  return null
}
