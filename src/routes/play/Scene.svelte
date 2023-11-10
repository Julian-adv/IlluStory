<script lang="ts">
  import type { SceneType, SceneResult } from '$lib/interfaces'
  import { onMount, tick } from 'svelte'
  import Markdown from '../common/Markdown.svelte'
  import { dialogues, lorebook, replaceDict, session, sessionPath, settings } from '$lib/store'
  import { getRandomSize, lastScene, realImageSize, scrollToEnd } from '$lib'
  import { generateImage } from '$lib/imageApi'
  import { translateText } from '$lib/deepLApi'
  import { extractImagePrompt } from '$lib/image'
  import ImageWithControl from './ImageWithControl.svelte'
  import { generateImageIfNeeded, saveImage } from '$lib/scene'
  import { saveSessionAuto } from '$lib/session'
  import { assistantRole } from '$lib/api'
  import { dirnameOf } from '$lib/fs'
  import { tcConvertImageSrc } from '$lib/tauriCompat'

  export let scene: SceneType
  let translated: boolean
  const last = lastScene($dialogues).id == scene.id
  let info: SceneResult =
    scene.role === assistantRole
      ? {
          showImage: true,
          imageSize: getRandomSize($settings.imageSizes),
          imageFromSD: new Promise((_resolve, _reject) => {})
        }
      : {
          showImage: false,
          imageSize: { width: 0, height: 0 },
          imageFromSD: new Promise((_resolve, _reject) => {})
        }
  let sessionDir = ''
  let imageUrl = tcConvertImageSrc(scene.image)
  let waitingImage = false

  $: imageWidth = realImageSize(info.imageSize.width)
  $: imageClass =
    imageWidth > window.innerWidth / 2
      ? 'clear-both flex justify-center items-end z-10 wrapper'
      : 'wrapper float-left flex items-end pl-4 mr-4'

  $: if (!scene.image && scene.role === assistantRole && scene.done && !waitingImage) {
    waitingImage = true
    generateNewImage()
    if (last) {
      tick().then(() => {
        scrollToEnd()
      })
    }
  }

  onMount(async () => {
    sessionDir = dirnameOf($sessionPath)
    if (scene.done) {
      info = await generateImageIfNeeded($settings, scene, sessionDir, last)
    }
    translated = !!scene.translatedContent
    info.imageFromSD.then(() => {
      saveSessionAuto($sessionPath, $session, $dialogues, $lorebook)
    })
  })

  function generateNewImage() {
    info.imageFromSD = generateImage(
      $settings,
      info.imageSize.width,
      info.imageSize.height,
      scene.textContent ?? ''
    ).then(result => {
      scene.image = saveImage(sessionDir, result)
      scene.imageSize = info.imageSize
      saveSessionAuto($sessionPath, $session, $dialogues, $lorebook)
      waitingImage = false
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
    scene = await extractImagePrompt($settings, scene, $replaceDict)
    info = await generateImageIfNeeded($settings, scene, sessionDir, last)
  }
</script>

<div class="block w-full mt-4">
  {#if info.showImage}
    <ImageWithControl
      imageFromSD={info.imageFromSD}
      bind:imageSize={info.imageSize}
      bind:image={imageUrl}
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
