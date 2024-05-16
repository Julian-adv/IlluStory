<script lang="ts">
  import type { SelectItem } from '$lib/interfaces'
  import { Button, Dropdown, DropdownDivider, DropdownItem, Search } from 'flowbite-svelte'
  import { ChevronDownSolid } from 'flowbite-svelte-icons'

  export let id = ''
  export let search = false
  export let value = ''
  export let items: SelectItem[]
  export let size: 'sm' | 'xs' | 'lg' | 'md' | 'xl' | undefined
  export let classStr = ''
  export let save = (_value: string) => {}

  let dropdownOpen = false
  let searchStr = ''
  let filteredItems: SelectItem[]
  let name = ''

  $: filteredItems = items.filter(item => item.name.toLowerCase().includes(searchStr.toLowerCase()))
  $: name = findName(value, items)

  function findName(str: string, items: SelectItem[]) {
    const selected = items.find(item => item.value === str)
    if (selected) {
      return selected.name
    }
    return ''
  }

  function onClick(item: SelectItem) {
    return (ev: Event) => {
      ev.stopPropagation()
      dropdownOpen = false
      value = item.value
      name = item.name
      save(value)
    }
  }
</script>

<Button {id} color="alternative" {size} class={classStr}
  >{name}
  <ChevronDownSolid
    class="w-3 h-3 ml-2 text-stone-400 dark:text-white focus:outline-none" /></Button>
{#if search}
  <Dropdown class="overflow-y-auto max-h-[40rem]" bind:open={dropdownOpen}>
    <div slot="header" class="p-2">
      <Search size="md" bind:value={searchStr} />
    </div>
    {#each filteredItems as item}
      {#if item.value.startsWith('-')}
        <DropdownDivider />
      {:else}
        <DropdownItem class="hover:bg-stone-100" on:click={onClick(item)}>{item.name}</DropdownItem>
      {/if}
    {/each}
  </Dropdown>
{:else}
  <Dropdown class="overflow-y-auto max-h-[40rem]" bind:open={dropdownOpen}>
    {#each filteredItems as item}
      {#if item.value.startsWith('-')}
        <DropdownDivider />
      {:else}
        <DropdownItem class="hover:bg-stone-100" on:click={onClick(item)}>{item.name}</DropdownItem>
      {/if}
    {/each}
  </Dropdown>
{/if}
