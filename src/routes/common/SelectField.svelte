<script lang="ts">
  import { Label, Helper } from "flowbite-svelte"
  import { onMount } from "svelte"
  import { helperClassHidden, helperClassVisible } from "$lib"
  import DropSelect from "./DropSelect.svelte"
  import type { SelectItem } from "$lib/interfaces"

  export let label = ''
  export let value = ''
  export let help = ''
  export let items: SelectItem[]
  export let search = false
  export let save = (_value:string) => {}

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
  <Label for={label} class='text-base self-center text-right w-full'>{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 p-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <DropSelect id={label} {items} {search} {save} size='sm' bind:value />
</div>
<div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 pl-1 pb-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}>
    <slot name='helper'><em>{help}</em></slot>
  </Helper>
</div>
