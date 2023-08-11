<script lang="ts">
  import { Label, Helper } from "flowbite-svelte"
  import { onMount } from "svelte"
  import { getUniqueId, helperClassHidden, helperClassVisible } from "$lib"
  import FlexibleTextarea from "./FlexibleTextarea.svelte"

  export let label = ''
  export let value = ''
  export let help = ''
  export let placeholder = ''
  export let save = () => {}

  let id = getUniqueId()

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
  <Label for={id} class='text-base self-center text-right w-full'>{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 p-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <FlexibleTextarea {id} {placeholder} bind:value on:blur={save} unWrappedClass='px-2 py-1 text-base prompt'/>
</div>
<div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 pl-1 pb-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}><em>{help}</em></Helper>
</div>