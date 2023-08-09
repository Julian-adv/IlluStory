<script lang="ts">
  import { Label, Helper, Select } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { helperClassHidden, helperClassVisible } from "$lib";

  export let label = '';
  export let value = '';
  export let help = '';
  export let items = [{ value: '', name: ''}];
  export let save = (value:string) => {};

  let helperClass = helperClassHidden;
  
  const showHelper = () => {
    helperClass = helperClassVisible;
  }

  const hideHelper = () => {
    helperClass = helperClassHidden;
  }

  onMount(() => {
    helperClass = helperClassHidden;
  })
</script>

<div class='w-36 flex p-1'>
  <Label for={label} class='text-base self-center text-right w-full'>{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 p-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Select id={label} {items} bind:value on:change={() => {save(value);}} class='px-2 py-1 text-base'/>
</div>
<div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 pl-1 pb-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}>
    <slot name='helper'><em>{help}</em></slot>
  </Helper>
</div>
