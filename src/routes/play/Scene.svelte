<script lang="ts">
  import type { ImageSize, SceneType } from "$lib/interfaces"
  import { onMount } from "svelte"
  import Markdown from "../common/Markdown.svelte"
  import { Button, Popover, Spinner } from "flowbite-svelte"
  import { saveImageToFile } from "$lib/fs"
  import { save } from "@tauri-apps/api/dialog"
  import { basename, downloadDir } from "@tauri-apps/api/path"
  import { settings } from "$lib/store"
  import { realImageSize } from "$lib"
  import { generateImage } from "$lib/imageApi"
  import { translateText } from "$lib/deepLApi"
  import { assistantRole, systemRole } from "$lib/api"
  import { extractImagePrompt } from "$lib/image"

  export let scene: SceneType
  let translated: boolean
  let showImage = false
  let imageFromSD = new Promise<string>((_resolve, _reject) => {})
  let waitingImage = false
  let imageSize: ImageSize = scene.imageSize ?? { width: 512, height: 512 }
  let popoverId = 'pop123'

  $: imageWidth = realImageSize(imageSize.width)
  $: imageHeight = realImageSize(imageSize.height)
  $: imageClass = imageWidth > window.innerWidth / 2 ?
                    'clear-both flex flex-col items-center z-10' :
                    'flex flex-col float-left mr-5 z-10'

  export async function generateImageIfNeeded(_sceneParam: SceneType) {
    if (scene.image) {
      showImage = true
      imageFromSD = Promise.resolve(scene.image)
    } else {
      if (!waitingImage && (scene.role === systemRole || scene.role === assistantRole)) {
        showImage = !!scene.visualContent
        if (showImage) {
          popoverId = 'image' + scene.id
          imageSize = getRandomSize($settings.imageSizes)
          imageFromSD = generateImage($settings, imageSize.width, imageSize.height, scene.visualContent?? '')
            .then(result => {
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
    generateImageIfNeeded(scene)
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

  function getRandomSize(sizes: string): ImageSize {
    const sizeArray = sizes.split(",")
    const randomSize = sizeArray[Math.floor(Math.random() * sizeArray.length)]
    const [width, height] = randomSize.split("x").map(Number)

    return { width, height }
  }

  function regenerateImage() {
    imageSize = getRandomSize($settings.imageSizes)
    imageFromSD = generateImage($settings, imageSize.width, imageSize.height, scene.visualContent?? '')
      .then(result => {
        scene.image = result
        scene.imageSize = imageSize
        return result
      })
  }

  function generateNewImage() {
    showImage = true
    imageSize = getRandomSize($settings.imageSizes)
    imageFromSD = generateImage($settings, imageSize.width, imageSize.height, scene.textContent?? '')
      .then(result => {
        scene.image = result
        scene.imageSize = imageSize
        return result
      })
  }

  async function saveImage() {
    if (scene.image) {
      const downDir = await downloadDir()
      const filePath = await save({ defaultPath: downDir, filters: [{ name: '*', extensions: ['png'] }] })
      if (filePath) {
        const fileName = await basename(filePath)
        saveImageToFile(scene.image, fileName)
      }
    }
  }

  async function onTranslate() {
    if (!scene.translatedContent) {
      scene.translatedContent = await translateText($settings, $settings.userLang, scene.textContent?? '')
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

<div class="block w-full">
  {#if showImage}
    <div class={imageClass}>
      {#await imageFromSD}
        <div class="placeholder flex justify-center items-center bg-stone-300 rounded-lg mt-2" style="--imageWidth: {imageWidth}px;--imageHeight: {imageHeight}px;">
          <Spinner class="mr-3" size="4" />
        </div>
      {:then image}
        <div id={popoverId} class="placeholder mt-2" style="--imageWidth: {imageWidth}px;--imageHeight: {imageHeight}px;--imageSrc: url('{image}')"></div>
        <Popover class='w-80 h-auto text-sm z-30' triggeredBy={'#'+popoverId}>
          <span>{scene.visualContent}</span>
        </Popover>
      {/await}
      <div class='flex gap-2'>
        <Button color='alternative' class='w-8 h-8 mb-1 p-0 bg-stone-100 z-20 text-stone-200 border-stone-100 focus:ring-0' on:click={regenerateImage}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        </Button>
        <Button color='alternative' class='w-8 h-8 mb-1 p-0 bg-stone-100 z-20 text-stone-200 border-stone-100 focus:ring-0' on:click={saveImage}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </Button>
      </div>
    </div>
  {/if}
  <Markdown bind:value={scene.textContent} bind:translatedValue={scene.translatedContent} bind:visualValue={scene.visualContent} bind:translated={translated} {onTranslate} {onEditDone} {generateNewImage} />
</div>
<div class="clear-both p-2"></div>

<style>
  .placeholder {
    width: var(--imageWidth);
    height: var(--imageHeight);
    background-image: var(--imageSrc);
    background-size: contain;
    background-repeat: no-repeat;
    /* box-shadow: 0 0 16px 16px #ffffff inset; */
    /* mask-image:
      linear-gradient(to top, black 0%, black 100%),
      linear-gradient(to top, transparent 0%, black 100%),
      linear-gradient(to right, transparent 0%, black 100%),
      linear-gradient(to bottom, transparent 0%, black 100%),
      linear-gradient(to left, transparent 0%, black 100%);
    mask-position:
      center,
      top,
      right,
      bottom,
      left;
    mask-size:
      100% 100%,
      100% 16px,
      16px 100%,
      100% 16px,
      16px 100%;
    mask-repeat:
      no-repeat,
      no-repeat,
      no-repeat,
      no-repeat,
      no-repeat;
    mask-composite:
      subtract,
      add,
      add,
      add,
      add; */
  }
</style>