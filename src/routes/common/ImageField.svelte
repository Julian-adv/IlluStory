<script lang="ts">
  import { Label, Helper } from 'flowbite-svelte'
  import { onMount } from 'svelte'
  import { helperClassHidden, helperClassVisible, realImageSize } from '$lib'
  import { loadImage } from '$lib/fs'

  export let label = ''
  export let value = ''
  export let help = ''
  export let width = 512
  export let height = 512
  export let save = () => {}

  $: imageWidth = realImageSize(width)
  $: imageHeight = realImageSize(height)

  let helperClass = helperClassHidden

  const showHelper = () => {
    helperClass = helperClassVisible
  }

  const hideHelper = () => {
    helperClass = helperClassHidden
  }

  async function onClick() {
    let image = await loadImage()
    if (image) {
      value = image
      save()
    }
  }

  onMount(() => {
    helperClass = helperClassHidden
  })
</script>

<div class="w-36 flex p-1">
  <Label for={label} class="text-base self-center text-right w-full">{label}</Label>
</div>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="col-span-2 p-1"
  on:mouseenter={showHelper}
  on:mouseleave={hideHelper}
  on:click={onClick}>
  {#if value}
    <img
      src={value}
      alt="Represent a preset"
      class="placeholder"
      style="--imageWidth: {imageWidth}px; --imageHeight: {imageHeight}px;" />
  {:else}
    <div
      class="placeholder float-left mr-5 flex justify-center items-center bg-stone-300"
      style="--imageWidth: {imageWidth}px; --imageHeight: {imageHeight}px;">
      <div>Click to change</div>
    </div>
  {/if}
</div>
<div></div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="col-span-2 pl-1 pb-1" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}><em>{help}</em></Helper>
</div>

<style>
  .placeholder {
    width: var(--imageWidth);
    height: var(--imageHeight);
  }
</style>
