<script lang="ts">
  import { Img, Label, Helper } from "flowbite-svelte"
  import { onMount } from "svelte"
  import { helperClassHidden, helperClassVisible } from "$lib"
  import { loadImage } from "$lib/fs"

  export let label = ''
  export let value = ''
  export let help = ''
  export let save = () => {}

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

<div class='w-36 flex p-1'>
  <Label for={label} class='text-base self-center text-right w-full'>{label}</Label>
</div>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 p-1' on:mouseenter={showHelper} on:mouseleave={hideHelper} on:click={onClick}>
  {#if value}
    <Img src={value} alt='Represent a preset' size='max-w-xs'/>
  {:else}
    <div class="placeholder float-left mr-5 flex justify-center items-center bg-stone-300">
      <div>Click to change</div>
    </div>
  {/if}
</div>
<div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 pl-1 pb-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}><em>{help}</em></Helper>
</div>

<style>
  .placeholder {
    width: 20rem;
    height: 20rem;
  }
</style>