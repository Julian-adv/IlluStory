import { readTextFile } from '@tauri-apps/api/fs'
import { open } from '@tauri-apps/api/dialog'
import { charExt, loadMetaData, savePath } from './fs'
import { CardType, type Char, type Preset, type StoryCard } from './interfaces'
import { dirname, sep } from '@tauri-apps/api/path'
import { charSetting, firstScene, userSetting } from './api'
import { char, charPath, curScene, curScenePath, user, userPath } from './store'
import { loadScene } from './scene'

export const emptyCard: StoryCard = {
  type: CardType.Preset,
  name: 'Card',
  path: '',
  image: '',
  modifiedAt: new Date()
}

export async function loadChar(path: string) {
  const json = await readTextFile(path)
  const char = JSON.parse(json) as Char
  return char
}

export async function loadCharDialog(): Promise<[Char | null, string]> {
  const selected = await open({ filters: [{ name: '*', extensions: [charExt] }] })
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

export async function cardFromPreset(preset: Preset, presetPath: string) {
  const dir = await dirname(presetPath)
  for (const prompt of preset.prompts) {
    if (prompt.role === charSetting) {
      const path = dir + sep + prompt.content
      char.set(await loadChar(path))
      charPath.set(path)
    } else if (prompt.role === userSetting) {
      const path = dir + sep + prompt.content
      user.set(await loadChar(path))
      userPath.set(path)
    } else if (prompt.role === firstScene) {
      const path = dir + sep + prompt.content
      curScene.set(await loadScene(path))
      curScenePath.set(path)
    }
  }
}
