import { get } from 'svelte/store'
import { translateText } from './deepLApi'
import type { Preset, SceneType, Settings, StringDictionary } from './interfaces'
import { replaceName } from './session'
import { chars } from './store'

export const visualStart = '<Visual>'
export const visualEnd = '</Visual>'

const regexp = new RegExp(`${visualStart}([^<]+)${visualEnd}`, 'g')

function clearImagePrompt(str: string) {
  return str.replace(regexp, '').trim()
}

export async function extractImagePrompt(
  settings: Settings,
  scene: SceneType,
  dict: StringDictionary
) {
  scene.content = replaceName(scene.content, dict)
  const matches = scene.content.match(regexp) || []
  const extractedContents = matches.map(str => str.slice(visualStart.length, -visualEnd.length))
  scene.textContent = clearImagePrompt(scene.content)
  scene.visualContent = extractedContents.join(',')
  if (settings.translateOutput && !scene.translatedContent) {
    scene.translatedContent = await translateText(settings, settings.userLang, scene.textContent)
  }
  return scene
}

function visualOfName(name: string | undefined) {
  const charArray = get(chars)
  for (const char of charArray) {
    if (char.name === name) {
      return char.visual
    }
  }
  // It shouldn't happen.
  return charArray[Math.floor(Math.random() * charArray.length)].visual
}

export function imageDescription(preset: Preset, scene: SceneType) {
  if (preset.visualizeMode === 'text') {
    const charVisual = visualOfName(scene.name)
    return charVisual + ',' + (scene.textContent ?? '')
  } else if (preset.visualizeMode === 'regexp' || preset.visualizeMode === 'generate') {
    return scene.visualContent ?? scene.textContent ?? ''
  }
  return ''
}
