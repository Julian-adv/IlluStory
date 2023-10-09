import { open } from '@tauri-apps/api/dialog'
import { charExt, dirnameOf, loadMetaData, savePath } from './fs'
import type { Char, Preset } from './interfaces'
import { firstScene, userSetting } from './api'
import { curScene, curScenePath, user, userPath } from './store'
import { loadScene } from './scene'
import { tcReadTextFile } from './tauriCompat'

export async function loadChar(path: string) {
  const json = await tcReadTextFile(path)
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
  const dir = dirnameOf(presetPath)
  for (const prompt of preset.prompts) {
    if (prompt.role === userSetting && prompt.content) {
      const path = (dir ? dir + '/' : '') + prompt.content
      user.set(await loadChar(path))
      userPath.set(path)
    } else if (prompt.role === firstScene && prompt.content) {
      const path = (dir ? dir + '/' : '') + prompt.content
      curScene.set(await loadScene(path))
      curScenePath.set(path)
    }
  }
}
