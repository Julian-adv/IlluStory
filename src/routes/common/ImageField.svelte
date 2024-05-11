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
  export let iconX = 0
  export let iconY = 0
  export let iconSize = 80
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

  let iconHandle = document.getElementById('icon-handle')
  let imageWrapper = document.getElementById('image-wrapper')
  onMount(() => {
    helperClass = helperClassHidden
    iconHandle = document.getElementById('icon-handle')
    imageWrapper = document.getElementById('image-wrapper')
  })

  let isDragging = false
  let handleDragging = false
  let offsetX = 0
  let offsetY = 0

  function onMouseDown(e: MouseEvent) {
    isDragging = true
    console.log('onMouseDown')
    if (iconHandle && imageWrapper) {
      const boundingRect = iconHandle.getBoundingClientRect()
      offsetX = e.clientX - boundingRect.left
      offsetY = e.clientY - boundingRect.top
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (isDragging) {
      if (iconHandle && imageWrapper) {
        if (handleDragging) {
          const size = e.clientX - iconHandle.getBoundingClientRect().left + 'px'
          iconHandle.style.width = size
          iconHandle.style.height = size
        } else {
          iconHandle.style.left =
            e.clientX - offsetX - imageWrapper.getBoundingClientRect().left + 'px'
          iconHandle.style.top =
            e.clientY - offsetY - imageWrapper.getBoundingClientRect().top + 'px'
        }
      }
    }
  }

  function onMouseUp(_e: MouseEvent) {
    isDragging = false
    handleDragging = false
    if (iconHandle && imageWrapper) {
      iconX =
        iconHandle.getBoundingClientRect().left - imageWrapper.getBoundingClientRect().left - 2
      iconY = iconHandle.getBoundingClientRect().top - imageWrapper.getBoundingClientRect().top - 2
    }
  }

  function onMouseDownHandle(e: MouseEvent) {
    console.log('on mouse down handle')
    handleDragging = true
    isDragging = true
    e.preventDefault()
  }
</script>

<div class="w-36 flex p-1">
  <Label for={label} class="text-base self-center text-right w-full">{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id="image-wrapper"
  class="col-span-2 p-1 image-wrapper"
  on:mousedown={onMouseDown}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}>
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
  <div id="icon-handle" class="icon-handle" style="--iconSize: {iconSize}px;">
    <div class="icon-handle-br" on:mousedown={onMouseDownHandle} />
  </div>
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

  .image-wrapper {
    position: relative;
  }

  .icon-handle {
    position: absolute;
    top: 50px;
    left: 50px;
    width: var(--iconSize);
    height: var(--iconSize);
    border: 2px solid blue;
  }

  .icon-handle-br {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 8px;
    height: 8px;
    background-color: blue;
  }
</style>
