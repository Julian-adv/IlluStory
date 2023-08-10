<script lang="ts">
  import { Textarea } from 'flowbite-svelte'
  import { marked } from 'marked'
  
  export let value = ''
  export let readOnly = true
  export let onEnter = (_markdown: string) => {}

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
  <div class='font-serif prose leading-relaxed markdown text-gray-900'>{@html marked.parse(value)}</div>
{:else}
  <Textarea id='textarea_input' bind:value placeholder='Write a prompt.' rows='1' unWrappedClass='px-2 py-1.5 focus:ring-gray-200 focus:border-gray-200 focus:ring-4 font-serif prompt' on:input={onInput} on:keydown={onKeyDown}/>
{/if}

<style>
  :global(.markdown .dialog) {
    color: #52525b;
    font-weight: bold;
  }

  :global(textarea.prompt) {
    overflow-y: hidden;
    resize: none;
  }
</style>