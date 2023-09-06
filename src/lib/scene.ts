import { readTextFile } from '@tauri-apps/api/fs'
import { savePath, sceneExt } from './fs'
import type { FirstScene } from './interfaces'
import { open } from '@tauri-apps/api/dialog'

export async function loadScene(path: string) {
  const json = await readTextFile(path)
  const scene = JSON.parse(json) as FirstScene
  return scene
}

export async function loadSceneDialog(): Promise<[FirstScene | null, string]> {
  const selected = await open({ filters: [{ name: '*', extensions: [sceneExt] }] })
  if (typeof selected === 'string') {
    return [await loadScene(selected), selected]
  }
  return [null, '']
}

export async function saveScene(scene: FirstScene) {
  let fileName = scene.title.replace(/[<>:"/\\|?*]/g, '_').trim()
  if (fileName === '') {
    fileName = 'scene' + Date.now()
  }
  fileName += '.' + sceneExt
  return savePath(fileName, sceneExt, scene)
}
