<script lang="ts">
  import type { SceneType } from "$lib/interfaces"
  import { onMount } from "svelte"
  import Markdown from "../common/Markdown.svelte"
  import { Button, Popover, Spinner } from "flowbite-svelte"
  import { saveImageToFile } from "$lib/fs"
  import { save } from "@tauri-apps/api/dialog"
  import { basename, downloadDir } from "@tauri-apps/api/path"
  import { replaceDict, settings } from "$lib/store"
  import { realImageSize } from "$lib"
  import { generateImage } from "$lib/imageApi"
  import { translateText } from "$lib/deepLApi"
  import { assistantRole, systemRole } from "$lib/api"

  export let scene: SceneType
  let content: string
  let showImage = false
  let imageFromSD = new Promise<string>((_resolve, _reject) => {})
  let waitingImage = false
  let imageWidth = realImageSize($settings.imageWidth)
  let imageHeight = realImageSize($settings.imageHeight)
  let popoverId = 'pop123'
  let imagePrompt = ''
  let translated = false
  const visualStart = '<Visual>'
  const visualEnd = '</Visual>'
    const regexp = new RegExp(`${visualStart}([^<]+)${visualEnd}`, 'g')
    $: imageClass = imageWidth > window.innerWidth / 2 ?
                    'clear-both flex flex-col items-center z-10' :
                    'flex flex-col float-left mr-5 z-10'

  function clearImagePrompt(str: string) {
          return str.replace(regexp, '').trim()
    }
    
  function convertToMarkdown(str: string) {
    if ($settings.convertMarkdown) {
      let text = str
      text = text.replace(/(?!=)"([^"]+)"/g, "<em class='dialog'>\"$1\"</em>")
      text = text.replace(/(?<=^|\n|> |>, |[.!?] )([^<".\n]*?)(?=((\.+|!|\?)($| |\n|<em))|( <em))/g, "<span class='description'>$1</span>")
      text = text.replace(/(?<=>"[^"]*?)<span class='description'>(?=.*?"<)/g, "<span>")
      const userNameRegex = new RegExp($replaceDict['user'], 'g')
      text = text.replace(userNameRegex, "<span class='userName'>$&</span>")
      const charNameRegex = new RegExp($replaceDict['char'], 'g')
      text = text.replace(charNameRegex, "<span class='charName'>$&</span>")
      return text
    }
    return str
  }

  async function translateOutput(scene: SceneType, translate: boolean) {
    let cleared = clearImagePrompt(scene.content)
    if (translate) {
      if (scene.translatedContent) {
        cleared = scene.translatedContent
      } else {
        scene.translatedContent = cleared = await translateText($settings, $settings.userLang, cleared)
      }
      translated = true
    } else {
      translated = false
    }
    return convertToMarkdown(cleared)
  }

  async function extractImagePrompt(scene: SceneType): Promise<[string, string]> {
    // const matches = scene.content.match(/\[\[([^\]]+)\]\]/g) || [];
    const matches = scene.content.match(regexp) || []
    const extractedContents = matches.map(str => str.slice(visualStart.length, -visualEnd.length))
        const markdown = await translateOutput(scene, $settings.translateOutput)
    return [markdown, extractedContents.join(',')]
  }

  export async function generateImageIfNeeded(_sceneParam: SceneType) {
    if (scene.image) {
      showImage = true;
      [content, imagePrompt] = await extractImagePrompt(scene)
      imageFromSD = Promise.resolve(scene.image)
      return
    }
    if (waitingImage || !(scene.role === systemRole || scene.role === assistantRole)) {
      return
    }
    let cleanedContent;
    [cleanedContent, imagePrompt] = await extractImagePrompt(scene)
    showImage = imagePrompt !== ''
    if (showImage) {
      content = cleanedContent
      popoverId = 'image' + scene.id
      imageFromSD = generateImage($settings, imagePrompt)
        .then(result => {
          scene.image = result
          return result
        })
    }
  }

  onMount(async () => {
    content = await translateOutput(scene, $settings.translateOutput)
    generateImageIfNeeded(scene)
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

  function regenerateImage() {
    imageFromSD = generateImage($settings, imagePrompt)
      .then(result => {
        scene.image = result
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

  async function translate() {
    content = await translateOutput(scene, !translated)
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
          <span>{imagePrompt}</span>
        </Popover>
      {/await}
      <div class='flex gap-2'>
        <Button color='alternative' class='w-10 h-10 p-0 bg-stone-100 z-20 text-stone-200 border-stone-100 focus:ring-0' pill on:click={regenerateImage}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        </Button>
        <Button color='alternative' class='w-10 h-10 p-0 bg-stone-100 z-20 text-stone-200 border-stone-100 focus:ring-0' pill on:click={saveImage}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </Button>
      </div>
    </div>
  {/if}
  <Markdown bind:value={content} />
  <Button color='alternative' class='w-7 h-7 p-0 focus:ring-0' on:click={translate}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
    </svg>
  </Button>
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