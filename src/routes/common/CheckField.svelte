<script lang="ts">
  import { Helper, Checkbox } from "flowbite-svelte"
  import { onMount } from "svelte"
  import { helperClassHidden, helperClassVisible } from "$lib"

  export let label = ''
  export let value = false
  export let help = ''
  export let save = () => {}

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
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 p-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Checkbox id={label} bind:checked={value} on:blur={save} on:change={save} class='py-1 text-base'>
    {label}
  </Checkbox>
</div>
<div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 pl-1 pb-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <Helper class={helperClass}>
    <slot name='helper'><em>{help}</em></slot>
  </Helper>
</div>
