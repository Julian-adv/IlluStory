<script lang="ts">
  import type { SceneType, SceneResult } from '$lib/interfaces'
  import { onMount } from 'svelte'
  import Markdown from '../common/Markdown.svelte'
  import { dialogues, replaceDict, session, sessionPath, settings } from '$lib/store'
  import { getRandomSize, lastScene, realImageSize } from '$lib'
  import { generateImage } from '$lib/imageApi'
  import { translateText } from '$lib/deepLApi'
  import { extractImagePrompt } from '$lib/image'
  import ImageWithControl from './ImageWithControl.svelte'
  import { generateImageIfNeeded, saveImage } from '$lib/scene'
  import { dirname } from '@tauri-apps/api/path'
  import { saveSessionAuto } from '$lib/session'

  export let scene: SceneType
  let translated: boolean
  const last = lastScene($dialogues).id == scene.id
  let info: SceneResult = {
    showImage: false,
    imageSize: { width: 512, height: 512 },
    imageFromSD: Promise.resolve('')
  }
  let sessionDir = ''

  $: imageWidth = realImageSize(info.imageSize.width)
  $: imageClass =
    imageWidth > window.innerWidth / 2
      ? 'clear-both flex justify-center items-end z-10 wrapper'
      : 'wrapper float-left flex items-end pl-4 mr-4'

  onMount(async () => {
    sessionDir = await dirname($sessionPath)
    console.log(sessionDir)
    info = await generateImageIfNeeded($settings, scene, sessionDir, last)
    translated = !!scene.translatedContent
    info.imageFromSD.then(() => {
      console.log('image loaded')
      // _extractColors(info.imageSize)
      console.log(scene)
      saveSessionAuto($sessionPath, $session, $dialogues)
    })
  })

  // afterUpdate(async () => {
  //   if (scene.done) {
  //     generateImageIfNeeded(scene)
  //   } else {
  //     const tempContent = await translateOutput(scene, $settings.translateOutput)
  //     if (tempContent !== content) {
  //       content = tempContent
  //     }
  //   }
  // })

  // function _extractColors(imageSize: ImageSize) {
  //   const leftElem = document.getElementById(leftId)
  //   const rightElem = document.getElementById(rightId)
  //   let canvas = document.createElement('canvas')
  //   canvas.width = imageSize.width
  //   canvas.height = imageSize.height

  //   let ctx = canvas.getContext('2d')
  //   let img = document.getElementById(popoverId)
  //   if (ctx && img) {
  //     ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  //     let leftBottomColor = ctx.getImageData(0, canvas.height - 1, 1, 1).data
  //     let leftTopColor = ctx.getImageData(0, 0, 1, 1).data
  //     let rightBottomColor = ctx.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data
  //     let rightTopColor = ctx.getImageData(canvas.width - 1, 0, 1, 1).data

  //     if (leftElem) {
  //       setLeftGradientBackground(
  //         leftElem,
  //         rgbToRgba(leftTopColor, 1),
  //         rgbToRgba(leftTopColor, 0),
  //         rgbToRgba(leftBottomColor, 1),
  //         rgbToRgba(leftBottomColor, 0)
  //       )
  //     }
  //     if (rightElem) {
  //       setRightGradientBackground(
  //         rightElem,
  //         rgbToRgba(rightTopColor, 1),
  //         rgbToRgba(rightTopColor, 0),
  //         rgbToRgba(rightBottomColor, 1),
  //         rgbToRgba(rightBottomColor, 0)
  //       )
  //     }
  //   }
  // }

  function _rgbToHex(rgb: Uint8ClampedArray) {
    return '#' + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)
  }

  function _rgbToRgba(rgb: Uint8ClampedArray, a: number) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`
  }

  function _setLeftGradientBackground(
    elem: HTMLElement,
    leftTopColor: string,
    leftTopEndColor: string,
    leftBottomColor: string,
    leftBottomEndColor: string
  ) {
    elem.style.background = `linear-gradient(255deg, ${leftTopColor}, ${leftTopEndColor} 70%),linear-gradient(285deg, ${leftBottomColor}, ${leftBottomEndColor} 70%)`
  }

  function _setRightGradientBackground(
    elem: HTMLElement,
    rightTopColor: string,
    rightTopEndColor: string,
    rightBottomColor: string,
    rightBottomEndColor: string
  ) {
    elem.style.background = `linear-gradient(105deg, ${rightTopColor}, ${rightTopEndColor} 70%),linear-gradient(75deg, ${rightBottomColor} 0, ${rightBottomEndColor} 70%)`
  }

  function generateNewImage() {
    info.showImage = true
    info.imageSize = getRandomSize($settings.imageSizes)
    info.imageFromSD = generateImage(
      $settings,
      info.imageSize.width,
      info.imageSize.height,
      scene.textContent ?? ''
    ).then(result => {
      scene.image = saveImage(sessionDir, result)
      scene.imageSize = info.imageSize
      return result
    })
  }

  async function onTranslate() {
    if (!scene.translatedContent) {
      scene.translatedContent = await translateText(
        $settings,
        $settings.userLang,
        scene.textContent ?? ''
      )
    }
  }

  async function onEditDone(content: string) {
    scene.content = content
    scene.translatedContent = ''
    scene.image = ''
    scene = await extractImagePrompt($settings, scene, $replaceDict)
    info = await generateImageIfNeeded($settings, scene, sessionDir, last)
  }
</script>

<div class="block w-full mt-4">
  {#if info.showImage}
    <ImageWithControl
      imageFromSD={info.imageFromSD}
      bind:imageSize={info.imageSize}
      bind:image={scene.image}
      tooltip={scene.visualContent}
      class={imageClass} />
  {/if}
  <div class="px-4">
    <Markdown
      bind:value={scene.textContent}
      bind:translatedValue={scene.translatedContent}
      bind:visualValue={scene.visualContent}
      bind:translated
      {onTranslate}
      {onEditDone}
      {generateNewImage}
      waiting={!scene.done} />
  </div>
</div>
<div class="clear-both p-2"></div>
