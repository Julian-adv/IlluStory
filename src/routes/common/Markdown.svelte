<script lang="ts">
  import { settings } from '$lib/store'
  import { marked } from 'marked'
  import FlexibleTextarea from './FlexibleTextarea.svelte'
  import { Button } from 'flowbite-svelte'
  
  export let value = ''
  export let translatedValue = ''
  export let translated = false
  export let readOnly = true
  export let placeholder = 'Write a prompt.'
  export let onEnter = (_markdown: string) => {}
  export let onArrowUp = () => {}
  export let onArrowDown = () => {}
  export let onTranslate = () => {}

  $: cssVarStyles = `--dialog-color:${$settings.dialogSettings.color};--dialog-weight:${$settings.dialogSettings.bold ? 'bold' : 'normal'};--dialog-style:${$settings.dialogSettings.italic ? 'italic' : 'normal'};--desc-color:${$settings.descriptionSettings.color};--desc-weight:${$settings.descriptionSettings.bold ? 'bold' : 'normal'};--desc-style:${$settings.descriptionSettings.italic ? 'italic' : 'normal'};--userName-color:${$settings.userNameSettings.color};--userName-weight:${$settings.userNameSettings.bold ? 'bold' : 'normal'};--userName-style:${$settings.userNameSettings.italic ? 'italic' : 'normal'};--charName-color:${$settings.charNameSettings.color};--charName-weight:${$settings.charNameSettings.bold ? 'bold' : 'normal'};--charName-style:${$settings.charNameSettings.italic ? 'italic' : 'normal'};--font-family:${$settings.fontFamily};--font-size:${$settings.fontSize}pt;`

  marked.use({
    breaks: true,
    gfm: true
  })

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      onEnter(value)
      value = ''
    } else if (event.key === 'ArrowUp') {
      const textarea = event.target as HTMLTextAreaElement
      if (textarea.selectionStart == 0) {
        event.preventDefault()
        event.stopImmediatePropagation()
        onArrowUp()
      }
    } else if (event.key === 'ArrowDown') {
      const textarea = event.target as HTMLTextAreaElement
      if (textarea.selectionStart == textarea.textLength) {
        event.preventDefault()
        event.stopImmediatePropagation()
        onArrowDown()
      }
    }
  }

  $: transButtonClass = translated ? 'text-sky-700 focus:text-sky-700' : 'text-stone-400 focus:text-stone-400'

  async function toggleTranslate() {
    translated = !translated
    onTranslate()
  }
</script>
  
{#if readOnly}
  <div class='font-serif prose leading-relaxed markdown text-gray-900' style={cssVarStyles}>
    {#if translated}
      {@html marked.parse(translatedValue)}
    {:else}
      {@html marked.parse(value)}
    {/if}
    <Button color='alternative' class={`w-6 h-6 p-0 focus:ring-0 bg-stone-100 inline-flex justify-center ml-1 ${transButtonClass}`} on:click={toggleTranslate}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
      </svg>
    </Button>
  </div>
{:else}
  <FlexibleTextarea bind:value {placeholder} unWrappedClass='px-2 py-1.5 focus:ring-gray-200 focus:border-gray-200 focus:ring-4 font-serif prompt' style={cssVarStyles} {onKeyDown}/>
{/if}

<style>
  :global(.markdown) {
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .dialog) {
    color: var(--dialog-color, black);
    font-weight: var(--dialog-weight, normal);
    font-style: var(--dialog-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .description) {
    color: var(--desc-color, black);
    font-weight: var(--desc-weight, normal);
    font-style: var(--desc-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .userName) {
    color: var(--userName-color, black);
    font-weight: var(--userName-weight, normal);
    font-style: var(--userName-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .charName) {
    color: var(--charName-color, black);
    font-weight: var(--charName-weight, normal);
    font-style: var(--charName-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(textarea.prompt) {
    font-family: var(--font-family, Geogia);
  }

  :global(.markdown > p) {
    display: inline;
  }
</style>