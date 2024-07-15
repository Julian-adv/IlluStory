<script lang="ts">
  import { Button, Dropdown, Helper, Label, Search } from 'flowbite-svelte'
  import { onMount } from 'svelte'
  import { helperClassHidden, helperClassVisible } from '$lib'
  import { ChevronDownOutline } from 'flowbite-svelte-icons'
  import { tcListFonts } from '$lib/tauriCompat'

  export let label = ''
  export let value = ''
  export let size = 12
  export let help = ''
  export let sample = ''
  export let save = () => {}
  let fonts: string[] = []
  let filteredFonts: string[] = []
  let dropdownOpen = false
  let searchStr = ''

  $: cssVarStyles = `--sample-family:${value};--sample-size:${size}pt`
  $: filteredFonts = fonts.filter(str => str.toLowerCase().includes(searchStr.toLowerCase()))

  let helperClass = helperClassHidden

  const showHelper = () => {
    helperClass = helperClassVisible
  }

  const hideHelper = () => {
    helperClass = helperClassHidden
  }

  function selectFont(font: string) {
    return () => {
      value = font
      dropdownOpen = false
      save()
    }
  }

  onMount(async () => {
    helperClass = helperClassHidden
    fonts = await tcListFonts()
  })
</script>

<div class="w-36 flex p-1">
  <Label for={label} class="text-base text-right w-full">{label}</Label>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="col-span-2 p-1" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <span class="block sample-font" style={cssVarStyles}>{sample} {value}</span>
  <div class="flex items-center gap-2">
    <Button color="alternative" size="sm"
      >Choose font<ChevronDownOutline
        name="chevron-down-solid"
        class="w-3 h-3 ml-2 text-white dark:text-white" /></Button>
    <Dropdown bind:open={dropdownOpen} class="overflow-y-auto px-3 pb-3 text-sm h-60">
      <div slot="header" class="p-2">
        <Search size="md" bind:value={searchStr} />
      </div>
      {#each filteredFonts as font}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li
          class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
          on:click={selectFont(font)}>
          {font}
        </li>
      {/each}
    </Dropdown>
  </div>
</div>
<div></div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="col-span-2 pl-1 pb-1" on:mouseenter={showHelper} on:mouseleave={hideHelper}>
  <Helper class={helperClass}><em>{help}</em></Helper>
</div>

<style>
  :global(.sample-font) {
    font-family: var(--sample-family, 'Geogia');
    font-size: var(--sample-size, 12pt);
  }
</style>
