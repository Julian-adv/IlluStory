<script lang="ts">
  import type { SceneType } from "$lib/interfaces"
  import { afterUpdate, onMount } from "svelte"
  import Markdown from "../Markdown.svelte"
  import { Button, Popover, Spinner } from "flowbite-svelte"
  import { saveImageToFile } from "$lib/fs"
  import { save } from "@tauri-apps/api/dialog"
  import { basename, downloadDir } from "@tauri-apps/api/path"
  import { replaceDict, settings } from "$lib/store"
  import { realImageSize } from "$lib"

  export let scene: SceneType
  let content: string
  let showImage = false
  let imageFromSD = new Promise<string>((_resolve, _reject) => {})
  let waitingImage = false
  let imageWidth = realImageSize($settings.imageWidth)
  let imageHeight = realImageSize($settings.imageHeight)
  let popoverId = 'pop123'
  let imagePrompt = ''
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
      text = text.replace(/(?<=^|\n|> |\. )([^<".\n]*?)(?=\.$|\.+ |\.\n)/g, "<span class='description'>$1</span>")
      text = text.replace(/(?<=>"[^"]*?)<span class='description'>(?=.*?"<)/g, "<span>")
      const userNameRegex = new RegExp($replaceDict['user'], 'g')
      text = text.replace(userNameRegex, "<span class='userName'>$&</span>")
      const charNameRegex = new RegExp($replaceDict['char'], 'g')
      text = text.replace(charNameRegex, "<span class='charName'>$&</span>")
      return text
    }
    return str
  }

  function extractImagePrompt(scene: SceneType): [string, string] {
    // const matches = scene.content.match(/\[\[([^\]]+)\]\]/g) || [];
    const matches = scene.content.match(regexp) || []
    const extractedContents = matches.map(str => str.slice(visualStart.length, -visualEnd.length))
    const cleanedInput = clearImagePrompt(scene.content)
    const markdown = convertToMarkdown(cleanedInput)
    return [markdown, extractedContents.join(',')]
  }

  export function generateImageIfNeeded(_sceneParam: SceneType) {
    if (scene.image) {
      showImage = true;
      [content, imagePrompt] = extractImagePrompt(scene)
      imageFromSD = Promise.resolve(scene.image)
      return
    }
    if (waitingImage || !(scene.role === 'system' || scene.role === 'assistant')) {
      return
    }
    let cleanedContent;
    [cleanedContent, imagePrompt] = extractImagePrompt(scene)
    showImage = imagePrompt !== ''
    if (showImage) {
      content = cleanedContent
      popoverId = 'image' + scene.id
      imageFromSD = generateImage(imagePrompt)
        .then(result => {
          scene.image = result
          return result
        })
    }
  }

  onMount(() => {
    content = convertToMarkdown(clearImagePrompt(scene.content))
    generateImageIfNeeded(scene)
  })

  afterUpdate(() => {
    if (scene.done) {
      generateImageIfNeeded(scene)
    } else {
      content = convertToMarkdown(clearImagePrompt(scene.content))
    }
  })

  async function generateImage(prompt: string): Promise<string> {
    const uri = $settings.sdURL + "/sdapi/v1/txt2img"
    waitingImage = true
    const responseFromSD = await fetch(uri, {
      body: JSON.stringify({
          "width": $settings.imageWidth,
          "height": $settings.imageHeight,
          "seed": -1,
          "steps": $settings.steps,
          "cfg_scale": $settings.cfgScale,
          "prompt": `${$settings.prompt},${prompt}`,
          "negative_prompt": $settings.negativePrompt,
          'sampler_name': $settings.sampler,
          "enable_hr": $settings.enableHires,
          "denoising_strength": $settings.denoisingStrength,
          "hr_scale": $settings.hiresScale,
          "hr_upscaler": $settings.hiresUpscaler,
          "alwayson_scripts": {
              "adetailer": {
                  "args": [
                      $settings.enableADetailer,
                      {'ad_model': 'face_yolov8n.pt', 'ad_prompt': '', 'ad_negative_prompt': '',
                        'ad_confidence': 0.3, 'ad_mask_min_ratio': 0, 'ad_mask_max_ratio': 1,
                        'ad_x_offset': 0, 'ad_y_offset': 0, 'ad_dilate_erode': 4,
                        'ad_mask_merge_invert': 'None', 'ad_mask_blur': 4, 'ad_denoising_strength': 0.4, 
                        'ad_inpaint_only_masked': true, 'ad_inpaint_only_masked_padding': 32, 
                        'ad_use_inpaint_width_height': false, 'ad_inpaint_width': 512, 
                        'ad_inpaint_height': 512, 'ad_use_steps': false, 'ad_steps': 28, 
                        'ad_use_cfg_scale': false, 'ad_cfg_scale': 7, 'ad_use_noise_multiplier': false, 
                        'ad_noise_multiplier': 1, 'ad_restore_face': false, 'ad_controlnet_model': 'None', 
                        'ad_controlnet_module': 'inpaint_global_harmonious', 'ad_controlnet_weight': 1, 
                        'ad_controlnet_guidance_start': 0, 'ad_controlnet_guidance_end': 1, 'is_api': true},
                      {'ad_model': 'None', 'ad_prompt': '', 'ad_negative_prompt': '', 'ad_confidence': 0.3, 
                        'ad_mask_min_ratio': 0, 'ad_mask_max_ratio': 1, 'ad_x_offset': 0, 'ad_y_offset': 0, 
                        'ad_dilate_erode': 4, 'ad_mask_merge_invert': 'None', 'ad_mask_blur': 4, 
                        'ad_denoising_strength': 0.4, 'ad_inpaint_only_masked': true, 
                        'ad_inpaint_only_masked_padding': 32, 'ad_use_inpaint_width_height': false, 
                        'ad_inpaint_width': 512, 'ad_inpaint_height': 512, 'ad_use_steps': false, 
                        'ad_steps': 28, 'ad_use_cfg_scale': false, 'ad_cfg_scale': 7, 
                        'ad_use_noise_multiplier': false, 'ad_noise_multiplier': 1, 'ad_restore_face': false,
                        'ad_controlnet_model': 'None', 'ad_controlnet_module': 'inpaint_global_harmonious', 
                        'ad_controlnet_weight': 1, 'ad_controlnet_guidance_start': 0, 'ad_controlnet_guidance_end': 1, 
                        'is_api': true}
                  ]
              }
          }
      }),
      headers:{
          'Content-Type': 'application/json',
      },
      method: "POST"
    })   

    if (responseFromSD.ok) {
      let dataFromSD = await responseFromSD.json()
      waitingImage = false
      return `data:image/png;base64,${dataFromSD.images[0]}`
    } else {
      waitingImage = false
      return ''
    }
  }

  function regenerateImage() {
    imageFromSD = generateImage(imagePrompt)
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
  <!-- {scene.id} -->
  <!-- <span class='role'>{scene.role}:</span> -->
  <Markdown value={content} />
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