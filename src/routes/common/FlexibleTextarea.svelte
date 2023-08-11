<script lang="ts">
  import { Textarea } from "flowbite-svelte"
  import { onMount } from "svelte"

  export let id = ''
  export let placeholder = ''
  export let value = ''
  export let unWrappedClass = ''
  export let onKeyDown = (_e: KeyboardEvent) => {}
  export let save = () => {}

  function onInput(this: HTMLElement) {
    this.style.height = 'auto'
    this.style.height = (this.scrollHeight) + 'px'
  }

  onMount(() => {
    const textarea = document.getElementById(id)
    if (textarea) {
      onInput.call(textarea)
    }
  })
</script>

<Textarea {id} {placeholder} {unWrappedClass} rows={1} bind:value on:blur={save} on:input={onInput} on:keydown={onKeyDown} class='px-2 py-1 text-base prompt'/>