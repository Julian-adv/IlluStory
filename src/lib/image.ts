import { translateText } from './deepLApi'
import type { SceneType, Settings, StringDictionary } from './interfaces'
import { replaceName } from './session'

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
