<script lang="ts">
  import { Label, Input, Helper } from 'flowbite-svelte'
  import { onMount } from 'svelte'
  import { helperClassHidden, helperClassVisible, labelColor } from '$lib'
  import type { FormSizeType } from 'flowbite-svelte'

  export let label = ''
  export let value: number[] = []
  export let defaultValue: number[] = []
  export let help = ''
  export let placeholder = ''
  export let disabled = false
  export let size: FormSizeType = 'md'
  export let save = () => {}
  export let onBlur = (_value: number[]) => {}

  let helperClass = helperClassHidden
  let strValue = ''

  const showHelper = () => {
    helperClass = helperClassVisible
  }

  const hideHelper = () => {
    helperClass = helperClassHidden
  }

  onMount(() => {
    helperClass = helperClassHidden
    strValue = value.join(', ')
  })
</script>

<div class="w-36 flex p-1">
  <Label
    for={label}
    class="text-base self-center text-right w-full {labelColor(value, defaultValue)}"
    >{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="col-span-2 p-1" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Input
    id={label}
    {placeholder}
    {size}
    {disabled}
    bind:value={strValue}
    on:blur={() => {
      value = strValue.split(',').map(v => parseInt(v))
      console.log(strValue, value)
      save()
      onBlur(value)
    }}
    class="px-2 py-1 text-base focus:ring-gray-200 focus:border-gray-200 focus:ring-4" />
</div>
<div></div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="col-span-2 pl-1 pb-1" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}>
    <slot name="helper"><em>{help}</em></slot>
  </Helper>
</div>
