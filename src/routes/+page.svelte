<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '$lib/settings'
  import { readDir, BaseDirectory, readTextFile } from '@tauri-apps/api/fs'
  import { Button, Card, Chevron, Dropdown, DropdownItem, Spinner } from 'flowbite-svelte'
  import { sortAscending, sortDescending, sortTypeDate, sortTypeName, type Story, type StoryCard } from '$lib/interfaces'
  import { currentTab, story, storyPath, settings } from '$lib/store'
  import { metadata } from 'tauri-plugin-fs-extra-api'
  import { loadStory } from '$lib/fs'

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
    const tempStory = await loadStory(path)
      if (tempStory) {
        $storyPath = path
        $story = tempStory
        $currentTab = '/write'
      }
    }
  }

  let sortOpen = false

  function resort() {
    if ($settings.sortType === sortTypeName) {
      cards.sort((cardA, cardB) => {
        if (cardA.name > cardB.name) {
          return $settings.sortOrder === sortAscending ? 1 : -1
        }
        if (cardA.name < cardB.name) {
          return $settings.sortOrder === sortAscending ? -1 : 1
        }
        return 0
      })
    }
    if ($settings.sortType === sortTypeDate) {
      cards.sort((cardA, cardB) => {
        if (cardA.modifiedAt > cardB.modifiedAt) {
          return $settings.sortOrder === sortAscending ? 1 : -1
        }
        if (cardA.modifiedAt < cardB.modifiedAt) {
          return $settings.sortOrder === sortAscending ? -1 : 1
        }
        return 0
      })
    }
    cards = cards
  }

  function changeSortType(newSortType: string) {
    sortOpen = false
    $settings.sortType = newSortType
    resort()
    saveSettings()
  }

  function toggleSortOrder() {
    if ($settings.sortOrder === sortAscending) {
      $settings.sortOrder = sortDescending
    } else {
      $settings.sortOrder = sortAscending
    }
    resort()
    saveSettings()
  }
</script>

<main>
  <div class="my-1 flex gap-2">
    <Button color="alternative" size="sm"><Chevron>{$settings.sortType}</Chevron></Button>
    <Dropdown bind:open={sortOpen}>
      <DropdownItem on:click={() => {changeSortType(sortTypeName)}}>Name</DropdownItem>
      <DropdownItem on:click={() => {changeSortType(sortTypeDate)}}>Modified Date</DropdownItem>
    </Dropdown>
    <Button color="alternative" size="sm" on:click={toggleSortOrder}>
      {#if $settings.sortOrder === sortAscending}
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
