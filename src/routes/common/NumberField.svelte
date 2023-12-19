<script lang="ts">
  import { Label, Input, Helper, Range } from 'flowbite-svelte'
  import { onMount } from 'svelte'
  import { helperClassHidden, helperClassVisible, labelColor } from '$lib'

  export let label = ''
  export let value = 0.0
  export let defaultValue = 0.0
  export let min = 0.0
  export let max = 1.0
  export let help = ''
  export let step = 0.01
  export let save = (_value: number) => {}

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

<div class="w-36 flex p-1">
  <Label
    for={label}
    class="text-base self-center text-right w-full {labelColor(value, defaultValue)}"
    >{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="p-1 flex" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Input
    id={label}
    type="number"
    bind:value
    {step}
    on:blur={() => {
      value = Number(value)
      save(value)
    }}
    class="px-2 py-1 self-center text-base" />
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="flex" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Range
    id={label + 'range'}
    size="sm"
    bind:value
    {min}
    {max}
    {step}
    on:change={() => {
      value = Number(value)
      save(value)
    }}
    class="self-center" />
</div>

<div></div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="col-span-2 pl-1 pb-1" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}><em>{help}</em></Helper>
</div>
