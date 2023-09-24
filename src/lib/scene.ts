import { readTextFile } from '@tauri-apps/api/fs'
import { saveImageToFile, savePath, sceneExt } from './fs'
import type { FirstScene, SceneResult, SceneType, Settings } from './interfaces'
import { open } from '@tauri-apps/api/dialog'
import { assistantRole, systemRole } from './api'
import { getRandomSize, scrollToEnd } from '$lib'
import { tick } from 'svelte'
import { generateImage } from './imageApi'
import { sep } from '@tauri-apps/api/path'
import { convertFileSrc } from '@tauri-apps/api/tauri'

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

export function saveImage(sessionPath: string, result: string) {
  const imagePath = sessionPath + sep + 'image' + Date.now() + '.png'
  saveImageToFile(result, imagePath)
  return convertFileSrc(imagePath)
}

export async function generateImageIfNeeded(
  settings: Settings,
  scene: SceneType,
  sessionPath: string,
  lastScene: boolean
): Promise<SceneResult> {
  let showImage = false
  let imageFromSD = new Promise<string>((_resolve, _reject) => {})
  let imageSize = { width: 0, height: 0 }
  if (scene.image) {
    showImage = true
    imageFromSD = new Promise<string>((resolve, _reject) => {
      const img = new Image()
      img.onload = function () {
        imageSize.width = (this as HTMLImageElement).width
        imageSize.height = (this as HTMLImageElement).height
        resolve(scene.image ?? '')
      }
      img.src = scene.image ?? ''
    })
    await imageFromSD
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
            scene.image = saveImage(sessionPath, result)
            scene.imageSize = imageSize
            return result
          }
        )
      }
    }
  }
  return { showImage, imageFromSD, imageSize }
}
