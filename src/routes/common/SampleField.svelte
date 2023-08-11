<script lang="ts">
  import { Helper, Checkbox, Label } from "flowbite-svelte"
  import { onMount } from "svelte"
  import { helperClassHidden, helperClassVisible } from "$lib"
  import ColorPicker from 'svelte-awesome-color-picker'
  import type { TextSettings } from "$lib/interfaces"
  import { settings } from "$lib/store"

  export let label = ''
  export let value: TextSettings = {
    italic: false,
    bold: false,
    color: "#000000"
  }
  export let help = ''
  export let sample = ''
  export let save = () => {}

  $: cssVarStyles = `--sample-color:${value.color};--sample-weight:${value.bold ? 'bold' : 'normal'};--sample-style:${value.italic ? 'italic' : 'normal'};--sample-family:${$settings.fontFamily};--sample-size:${$settings.fontSize}pt`

  let helperClass = helperClassHidden
  
  const showHelper = () => {
    helperClass = helperClassVisible
  }

  const hideHelper = () => {
    helperClass = helperClassHidden
  }

  onMount(() => {
    helperClass = helperClassHidden
  })
</script>

<div class='w-36 flex p-1'>
  <Label for={label} class='text-base text-right w-full'>{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 p-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <span class="block sample" style={cssVarStyles}>{sample}</span>
  {#if value}
  <div class="flex items-center gap-2">
    <Checkbox id={label} bind:checked={value.italic} on:blur={save} on:change={save} class='py-1 text-base inline'>
      Italic
    </Checkbox>
    <Checkbox id={label} bind:checked={value.bold} on:blur={save} on:change={save} class='py-1 text-base inline'>
      Bold
    </Checkbox>
    <ColorPicker bind:hex={value.color} label='Color'/>
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
  .sample {
    color: var(--sample-color, black);
    font-weight: var(--sample-weight, normal);
    font-style: var(--sample-style, normal);
    font-family: var(--sample-family, Geogia);
    font-size: var(--sample-size, 12pt);
  }

  div :global(.color-picker) {
    display: flex inline;
  }

  div :global(.alpha) {
    width: 20px;
    height: 20px;
  }

  div :global(.color) {
    width: 20px;
    height: 20px;
  }
</style>