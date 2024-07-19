<script lang="ts">
  import { getRandomSize, getUniqueId, realImageSize } from '$lib'
  import { saveImageToFile } from '$lib/fs'
  import { generateImage } from '$lib/imageApi'
  import type { ImageSize } from '$lib/promptInterface'
  import { settings } from '$lib/store'
  import { tcSave } from '$lib/tauriCompat'
  import { Button, Popover, Spinner } from 'flowbite-svelte'

  export let imageFromSD: Promise<string>
  export let image = ''
  export let imageSize: ImageSize = { width: 512, height: 512 }
  export let tooltip = ''
  let className = ''
  export { className as class }
  export let name = ''

  let popoverId = getUniqueId()

  $: imageWidth = realImageSize(imageSize.width)
  $: imageHeight = realImageSize(imageSize.height)

  function regenerateImage() {
    imageSize = getRandomSize($settings.imageSizes)
    imageFromSD = generateImage(
      $settings,
      imageSize.width,
      imageSize.height,
      tooltip,
      $settings.ipWeight,
      name + '.png'
    ).then(result => {
      image = result
      imageSize = imageSize
      return result
    })
  }

  async function saveImage() {
    if (image) {
      const downDir = $settings.dataDir
      const filePath = await tcSave({
        defaultPath: downDir,
        filters: [{ name: '*', extensions: ['png'] }]
      })
      if (filePath) {
        saveImageToFile(image, filePath)
      }
    }
  }
</script>

<div class={className + ' wrapper mb-4'}>
  {#await imageFromSD}
    <div
      class="placeholder flex justify-center items-center bg-stone-300"
      style="--imageWidth: {imageWidth}px;--imageHeight: {imageHeight}px;">
      <Spinner class="mr-3" size="4" />
    </div>
    {#if $settings.blurBackground}
      <div class="w-full flex solid-background"></div>
    {/if}
  {:then image}
    <div
      id={popoverId}
      class="placeholder"
      style="--imageWidth: {imageWidth}px;--imageHeight: {imageHeight}px;--imageSrc: url('{image}');" />
    {#if $settings.blurBackground}
      <div class="w-full flex blur-background" style="--imageSrc: url('{image}')"></div>
    {/if}
    <Popover class="w-80 h-auto text-sm z-30" triggeredBy={'#' + popoverId}>
      <span>{tooltip}</span>
    </Popover>
  {/await}
  <div class="flex flex-col gap-2">
    <Button
      color="alternative"
      class="w-8 h-8 mb-1 p-0 bg-transparent z-20 text-stone-600 border-0 focus:ring-0 hover:bg-transparent"
      on:click={regenerateImage}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    </Button>
    <Button
      color="alternative"
      class="w-8 h-8 mb-1 p-0 bg-transparent z-20 text-stone-600 border-0 focus:ring-0 hover:bg-transparent"
      on:click={saveImage}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    </Button>
  </div>
</div>

<style>
  .wrapper {
    position: relative;
    overflow: hidden;
  }

  .placeholder {
    width: var(--imageWidth);
    height: var(--imageHeight);
    background-image: var(--imageSrc);
    background-size: contain;
    /* background-repeat: no-repeat; */
    z-index: 12;
    position: relative;
    /* box-shadow: 0 0 16px 16px #ffffff inset; */
    /* mask-image: linear-gradient(to top, black 0%, black 100%),
      linear-gradient(to top, transparent 0%, black 100%),
      linear-gradient(to right, transparent 0%, black 100%),
      linear-gradient(to bottom, transparent 0%, black 100%),
      linear-gradient(to left, transparent 0%, black 100%);
    mask-position: center, top, right, bottom, left;
    mask-size:
      100% 100%,
      100% 16px,
      16px 100%,
      100% 16px,
      16px 100%;
    mask-repeat: no-repeat, no-repeat, no-repeat, no-repeat, no-repeat;
    mask-composite: subtract, add, add, add, add; */
  }

  .blur-background {
    background-image: var(--imageSrc);
    background-size: 100% 100%;
    filter: blur(0.9rem);
    opacity: 0.4;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 11;
  }

  .solid-background {
    background-color: #d6d3d1;
    background-size: 100% 100%;
    filter: blur(0.9rem);
    opacity: 0.4;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 11;
  }
</style>
