import { saveImageToFile, savePath, sceneExt } from './fs'
import type { FirstScene, Preset, SceneResult, Settings } from './interfaces'
import type { SceneType } from './promptInterface'
import { assistantRole, systemRole } from './api'
import { getRandomSize, scrollToEnd } from '$lib'
import { tick } from 'svelte'
import { generateImage } from './imageApi'
import { tcConvertImageSrc, tcOpen, tcReadTextFile } from './tauriCompat'
import { imageDescription } from './image'

export async function loadScene(path: string) {
  const json = await tcReadTextFile(path)
  const scene = JSON.parse(json) as FirstScene
  return scene
}

export async function loadSceneDialog(): Promise<[FirstScene | null, string]> {
  const selected = await tcOpen({ filters: [{ name: '*', extensions: [sceneExt] }] })
  if (selected) {
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
  if (!sessionPath) {
    return ''
  }
  const imagePath = sessionPath + '/image' + Date.now() + '.png'
  saveImageToFile(result, imagePath)
  return imagePath
}

export async function generateImageIfNeeded(
  settings: Settings,
  preset: Preset,
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
      const imageUrl = tcConvertImageSrc(scene.image)
      img.onload = function () {
        imageSize.width = (this as HTMLImageElement).width
        imageSize.height = (this as HTMLImageElement).height
        resolve(imageUrl ?? '')
      }
      img.src = imageUrl
    })
    await imageFromSD
  } else {
    if (scene.role === systemRole || scene.role === assistantRole) {
      showImage = !!scene.visualContent
      const imageSource = imageDescription(preset, scene)
      if (imageSource) {
        showImage = true
        imageSize = getRandomSize(settings.imageSizes)
        if (lastScene) {
          await tick()
          scrollToEnd()
        }
        imageFromSD = generateImage(
          settings,
          imageSize.width,
          imageSize.height,
          imageSource,
          settings.ipWeight,
          scene.name + '.png'
        ).then(result => {
          scene.image = saveImage(sessionPath, result)
          scene.imageSize = imageSize
          return result
        })
      }
    }
  }
  return { showImage, imageFromSD, imageSize }
}
