<script lang="ts">
  import { settings } from '$lib/store'
  import { Textarea } from 'flowbite-svelte'
  import { marked } from 'marked'
  
  export let value = ''
  export let readOnly = true
  export let onEnter = (_markdown: string) => {}

  $: cssVarStyles = `--dialog-color:${$settings.dialogSettings.color};--dialog-weight:${$settings.dialogSettings.bold ? 'bold' : 'normal'};--dialog-style:${$settings.dialogSettings.italic ? 'italic' : 'normal'};--desc-color:${$settings.descriptionSettings.color};--desc-weight:${$settings.descriptionSettings.bold ? 'bold' : 'normal'};--desc-style:${$settings.descriptionSettings.italic ? 'italic' : 'normal'};--userName-color:${$settings.userNameSettings.color};--userName-weight:${$settings.userNameSettings.bold ? 'bold' : 'normal'};--userName-style:${$settings.userNameSettings.italic ? 'italic' : 'normal'};--charName-color:${$settings.charNameSettings.color};--charName-weight:${$settings.charNameSettings.bold ? 'bold' : 'normal'};--charName-style:${$settings.charNameSettings.italic ? 'italic' : 'normal'};`
  marked.use({
    breaks: true,
    gfm: true
  })

  function onInput(this: HTMLElement) {
    this.style.height = 'auto'
    this.style.height = (this.scrollHeight) + 'px'
  }

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
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <div class='font-serif prose leading-relaxed markdown text-gray-900' style={cssVarStyles}>{@html marked.parse(value)}</div>
{:else}
  <Textarea id='textarea_input' bind:value placeholder='Write a prompt.' rows='1' unWrappedClass='px-2 py-1.5 focus:ring-gray-200 focus:border-gray-200 focus:ring-4 font-serif prompt' on:input={onInput} on:keydown={onKeyDown}/>
{/if}

<style>
  :global(.markdown .dialog) {
    color: var(--dialog-color, black);
    font-weight: var(--dialog-weight, normal);
    font-style: var(--dialog-style, normal);
  }

  :global(.markdown .description) {
    color: var(--desc-color, black);
    font-weight: var(--desc-weight, normal);
    font-style: var(--desc-style, normal);
  }

  :global(.markdown .userName) {
    color: var(--userName-color, black);
    font-weight: var(--userName-weight, normal);
    font-style: var(--userName-style, normal);
  }

  :global(.markdown .charName) {
    color: var(--charName-color, black);
    font-weight: var(--charName-weight, normal);
    font-style: var(--charName-style, normal);
  }

  :global(textarea.prompt) {
    overflow-y: hidden;
    resize: none;
  }
</style>