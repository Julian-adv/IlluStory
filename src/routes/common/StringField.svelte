<script lang="ts">
  import { Label, Input, Helper } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { helperClassHidden, helperClassVisible } from "$lib";

  export let label = '';
  export let value = '';
  export let help = '';
  export let placeholder = '';
  export let save = () => {};

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
  <Input id={label} {placeholder} bind:value on:blur={save} class='px-2 py-1 text-base'/>
</div>
<div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='col-span-2 pl-1 pb-1' on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}><em>{help}</em></Helper>
</div>
