<script lang="ts">
  import '@milkdown/theme-nord/style.css'
  import { onMount } from 'svelte'
  import { loadSettings } from '$lib/fs'
  import { readDir, BaseDirectory, readTextFile } from '@tauri-apps/api/fs'
  import { Button, Card, Chevron, Dropdown, DropdownItem, Spinner } from 'flowbite-svelte'
  import type { Story, StoryCard } from '$lib/interfaces'
  import { currentTab, story, storyPath } from '$lib/store'
  import { metadata } from 'tauri-plugin-fs-extra-api'

  let cards:StoryCard[] = []
  let loading = false

  onMount(async () => {
    await loadSettings()

    loading = true
    const entries = await readDir('.', { dir: BaseDirectory.AppData, recursive: true })
    for (const entry of entries) {
      if (entry.name?.endsWith('.json')) {
        let storyText = await readTextFile(entry.path)
        let story = JSON.parse(storyText) as Story
        let image = ''
        if (story) {
          if (story.image) {
            image = story.image
          } else if (story.prompts && story.prompts.length > 0 && story.prompts[0].image) {
            image = story.prompts[0].image
          }
        }
        const stat = await metadata(entry.path)
        cards.push({
          name: entry.name.slice(0, -5),
          path: entry.path,
          modifiedAt: stat.modifiedAt,
          image: image
        })
      }
    }
    resort()
    loading = false
  })

  function onClick(path:string) {
    return async (_ev: Event) => {
      const storyText = await readTextFile(path)
      if (storyText) {
        $storyPath = path
        $story = JSON.parse(storyText)
        $currentTab = '/write'
      }
    }
  }

  let sortOpen = false
  const sortTypeName = 'Name'
  const sortTypeDate = 'Modified Date'
  let sortType = 'Name'
  const sortAscending = 'a'
  const sortDescending = 'd'
  let sortOrder = sortAscending

  function resort() {
    if (sortType === sortTypeName) {
      cards.sort((cardA, cardB) => {
        if (cardA.name > cardB.name) {
          return sortOrder === sortAscending ? 1 : -1
        }
        if (cardA.name < cardB.name) {
          return sortOrder === sortAscending ? -1 : 1
        }
        return 0
      })
    }
    if (sortType === sortTypeDate) {
      cards.sort((cardA, cardB) => {
        if (cardA.modifiedAt > cardB.modifiedAt) {
          return sortOrder === sortAscending ? 1 : -1
        }
        if (cardA.modifiedAt < cardB.modifiedAt) {
          return sortOrder === sortAscending ? -1 : 1
        }
        return 0
      })
    }
    cards = cards
  }

  function changeSortType(newSortType: string) {
    sortOpen = false
    sortType = newSortType
    resort()
  }

  function toggleSortOrder() {
    if (sortOrder === sortAscending) {
      sortOrder = sortDescending
    } else {
      sortOrder = sortAscending
    }
    resort()
  }
</script>

<main>
  <div class="my-1 flex gap-2">
    <Button color="alternative" size="sm"><Chevron>{sortType}</Chevron></Button>
    <Dropdown bind:open={sortOpen}>
      <DropdownItem on:click={() => {changeSortType(sortTypeName)}}>Name</DropdownItem>
      <DropdownItem on:click={() => {changeSortType(sortTypeDate)}}>Modified Date</DropdownItem>
    </Dropdown>
    <Button color="alternative" size="sm" on:click={toggleSortOrder}>
      {#if sortOrder === sortAscending}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
        </svg>
      {/if}
    </Button>
  </div>
  {#if loading}
    <div class='flex w-full items-center justify-center' style='height: 80vh'>
      <Spinner size='8' />
    </div>
  {:else}
    <div class="flex flex-wrap flex-none gap-2">
      {#each cards as card}
        <Card href='/write' img={card.image} class='w-52' on:click={onClick(card.path)}>
          <h2>{card.name}</h2>
        </Card>
      {/each}
    </div>
  {/if}
</main>
