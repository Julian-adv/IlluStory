<script lang="ts">
  import type { ImageSize, SceneType } from '$lib/interfaces'
  import { onMount, tick } from 'svelte'
  import Markdown from '../common/Markdown.svelte'
  import { dialogues, settings } from '$lib/store'
  import { getRandomSize, lastScene, realImageSize, scrollToEnd } from '$lib'
  import { generateImage } from '$lib/imageApi'
  import { translateText } from '$lib/deepLApi'
  import { assistantRole, systemRole } from '$lib/api'
  import { extractImagePrompt } from '$lib/image'
  import ImageWithControl from './ImageWithControl.svelte'

  export let scene: SceneType
  let translated: boolean
  let showImage = false
  let imageFromSD = new Promise<string>((_resolve, _reject) => {})
  let waitingImage = false
  let imageSize: ImageSize = scene.imageSize ?? { width: 512, height: 512 }

  $: imageWidth = realImageSize(imageSize.width)
  $: imageClass =
    imageWidth > window.innerWidth / 2
      ? 'clear-both flex justify-center items-end z-10 wrapper'
      : 'wrapper float-left flex items-end pl-4 mr-4'

  export async function generateImageIfNeeded(_sceneParam: SceneType) {
    if (scene.image) {
      showImage = true
      imageFromSD = Promise.resolve(scene.image)
    } else {
      if (!waitingImage && (scene.role === systemRole || scene.role === assistantRole)) {
        showImage = !!scene.visualContent
        let imageSource = ''
        if ($settings.imageSource === 'full_desc') {
          imageSource = scene.textContent ?? ''
        } else if ($settings.imageSource === 'visual_tag') {
          imageSource = scene.visualContent ?? ''
        }
        if (imageSource) {
          showImage = true
          imageSize = getRandomSize($settings.imageSizes)
          if (lastScene($dialogues).id === scene.id) {
            await tick()
            scrollToEnd()
          }
          imageFromSD = generateImage(
            $settings,
            imageSize.width,
            imageSize.height,
            imageSource
          ).then(result => {
            scene.image = result
            scene.imageSize = imageSize
            return result
          })
        }
      }
    }
  }

  onMount(async () => {
    scene = await extractImagePrompt($settings, scene)
    await generateImageIfNeeded(scene)
    translated = !!scene.translatedContent
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
    showImage = true
    imageSize = getRandomSize($settings.imageSizes)
    imageFromSD = generateImage(
      $settings,
      imageSize.width,
      imageSize.height,
      scene.textContent ?? ''
    ).then(result => {
      scene.image = result
      scene.imageSize = imageSize
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
    scene = await extractImagePrompt($settings, scene)
    generateImageIfNeeded(scene)
  }
</script>

<div class="block w-full mt-4">
  {#if showImage}
    <ImageWithControl
      {imageFromSD}
      bind:imageSize
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
      {generateNewImage} />
  </div>
</div>
<div class="clear-both p-2"></div>
