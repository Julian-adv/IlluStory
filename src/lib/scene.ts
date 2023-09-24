import { readTextFile } from '@tauri-apps/api/fs'
import { savePath, sceneExt } from './fs'
import type { FirstScene, SceneResult, SceneType, Settings } from './interfaces'
import { open } from '@tauri-apps/api/dialog'
import { assistantRole, systemRole } from './api'
import { getRandomSize, scrollToEnd } from '$lib'
import { tick } from 'svelte'
import { generateImage } from './imageApi'

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

export async function generateImageIfNeeded(
  settings: Settings,
  scene: SceneType,
  lastScene: boolean
): Promise<SceneResult> {
  let showImage = false
  let imageFromSD = new Promise<string>((_resolve, _reject) => {})
  let imageSize = { width: 0, height: 0 }
  if (scene.image) {
    showImage = true
    imageFromSD = Promise.resolve(scene.image)
  } else {
    if (scene.role === systemRole || scene.role === assistantRole) {
      showImage = !!scene.visualContent
      let imageSource = ''
      if (settings.imageSource === 'full_desc') {
        imageSource = scene.textContent ?? ''
      } else if (settings.imageSource === 'visual_tag') {
        imageSource = scene.visualContent ?? ''
      }
      if (imageSource) {
        showImage = true
        imageSize = getRandomSize(settings.imageSizes)
        if (lastScene) {
          await tick()
          scrollToEnd()
        }
        imageFromSD = generateImage(settings, imageSize.width, imageSize.height, imageSource).then(
          result => {
            scene.image = result
            scene.imageSize = imageSize
            return result
          }
        )
      }
    }
  }
  return { showImage, imageFromSD, imageSize }
}
