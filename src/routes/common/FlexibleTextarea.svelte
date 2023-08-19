<script lang="ts">
  import { Textarea } from "flowbite-svelte"
  import { afterUpdate, onMount } from "svelte"

  export let id = ''
  export let placeholder = ''
  export let value = ''
  export let unWrappedClass = ''
  export let style = ''
  export let onKeyDown = (_e: KeyboardEvent) => {}
  export let onUpdate = (_str: string) => {}

  let textarea: HTMLElement|null

  function onInput(this: HTMLElement) {
    this.style.height = 'auto'
    this.style.height = (this.scrollHeight) + 'px'
  }

  function onChange() {
    onUpdate(value)
  }

  onMount(() => {
    textarea = document.getElementById(id)
  })

  afterUpdate(() => {
    if (textarea) {
      onInput.call(textarea)
    }
  })
</script>

<Textarea {id} {placeholder} {unWrappedClass} {style} rows={1} bind:value on:blur on:input={onInput} on:keydown={onKeyDown} on:change={onChange} class='px-2 py-1 text-base prompt focus:ring-gray-200 focus:border-gray-200 focus:ring-4'/>