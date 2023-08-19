<script lang="ts">
  import { settings } from '$lib/store'
  import { marked } from 'marked'
  import FlexibleTextarea from './FlexibleTextarea.svelte'
  
  export let value = ''
  export let readOnly = true
  export let placeholder = 'Write a prompt.'
  export let onEnter = (_markdown: string) => {}

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
    }
  }
</script>
  
{#if readOnly}
  <div class='font-serif prose leading-relaxed markdown text-gray-900' style={cssVarStyles}>{@html marked.parse(value)}</div>
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
</style>