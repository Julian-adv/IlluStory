<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '$lib/settings'
  import { readDir, BaseDirectory, readTextFile } from '@tauri-apps/api/fs'
  import { Button, Card, Dropdown, DropdownItem, Popover, Radio, Spinner } from 'flowbite-svelte'
  import { Icon } from 'flowbite-svelte-icons'
  import { sortAscending, sortDescending, sortTypeDate, sortTypeName, type Story, type StoryCard } from '$lib/interfaces'
  import { story, storyPath, settings } from '$lib/store'
  import { metadata } from 'tauri-plugin-fs-extra-api'
  import { allExts, basenameOf, loadStory } from '$lib/fs'
  import { allFlag, charExt, charFlag, sessionExt, sessionFlag, storyExt, storyFlag, extOf } from '$lib/fs'

  let cards: StoryCard[] = []
  let showingCards: StoryCard[] = []
  let loading = false
  let defaultImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII='

  onMount(async () => {
    await loadSettings()

    loading = true
    const entries = await readDir('.', { dir: BaseDirectory.AppData, recursive: true })
    for (const entry of entries) {
      if (entry.name) {
        const ext = extOf(entry.name)
        if (allExts.includes(ext)) {
          let storyText = await readTextFile(entry.path)
          let story = JSON.parse(storyText) as Story
          let image = defaultImage
          if (story) {
            if (story.image) {
              image = story.image
            } else if (story.prompts && story.prompts.length > 0) {
              for (const prompt of story.prompts) {
                if (prompt.image) {
                  image = prompt.image
                  break
                }
              }
            }
          }
          const stat = await metadata(entry.path)
          cards.push({
            name: basenameOf(entry.name),
            path: entry.path,
            modifiedAt: stat.modifiedAt,
            image: image
          })
        }
      }
    }
    resort()
    showingCards = filterExt(extFlag)
    loading = false
  })

  function onClick(path:string) {
    return async (_ev: Event) => {
    const tempStory = await loadStory(path)
      if (tempStory) {
        $storyPath = path
        $story = tempStory
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

  let extFlag = allFlag

  function filterExt(flag: number) {
    return cards.filter(card => {
      const ext = extOf(card.path)
      if (ext === storyExt && flag === storyFlag) {
        return true
      } else if (ext === sessionExt && flag === sessionFlag) {
        return true
      } else if (ext === charExt && flag === charFlag) {
        return true
      } else if (flag === allFlag) {
        return true
      }
      return false
    })
  }

  $: showingCards = filterExt(extFlag)

  function cardType(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === storyExt) {
      return 'Story'
    } else if (ext === sessionExt) {
      return 'Session'
    } else if (ext === charExt) {
      return 'Character'
    }
    return 'Unknown'
  }

  function grad(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === storyExt) {
      return 'linear-gradient(to bottom, #1e293b 60%, #020617 100%)'    // slate
    } else if (ext === sessionExt) {
      return 'linear-gradient(to bottom, #075985 60%, #082f49 100%)'    // sky
    } else if (ext === charExt) {
      return 'linear-gradient(to bottom, #a1a1aa 60%, #52525b 100%)'    // zinc 600
      // return 'linear-gradient(to bottom, #ec4899 60%, #831843 100%)'    // pink 900
      // return 'linear-gradient(to bottom, #fbcfe8 60%, #f472b6 100%)'    // pink 400
      // return 'linear-gradient(to bottom, #e11d48 60%, #9f1239 100%)'    // rose
      // return 'linear-gradient(to bottom, #facc15 60%, #a16207 100%)'    // yellow
      // return 'linear-gradient(to bottom, #115e59 60%, #042f2e 100%)'    // teal
    }
    return 'linear-gradient(to bottom, gray 60%, black 100%)'
  }

  function borderColor(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === storyExt) {
      return 'border-slate-400'
    } else if (ext === sessionExt) {
      return 'border-sky-400'
    } else if (ext === charExt) {
      return 'border-yellow-400'
    }
    return 'linear-gradient(to bottom, gray 60%, black 100%)'
  }

  function _isOverflowed(id: string) {
    const elem = document.getElementById(id)
    if (elem && elem.scrollWidth > elem.clientWidth) {
      return true
    }
    return false
  }

  function hrefOf(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === storyExt) {
      return '/write'
    } else if (ext === charExt) {
      return '/write_char'
    } else if (ext === sessionExt) {
      return '/play'
    }
    return '/'
  }
</script>

<main>
  <div class="my-1 flex gap-2">
    <Button color="alternative" size="sm">{$settings.sortType}<Icon name="chevron-down-solid" class="w-3 h-3 ml-2 text-white dark:text-white" /></Button>
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
    <Radio bind:group={extFlag} value={allFlag}>All</Radio>
    <Radio bind:group={extFlag} value={storyFlag}>Story</Radio>
    <Radio bind:group={extFlag} value={charFlag}>Character</Radio>
    <Radio bind:group={extFlag} value={sessionFlag}>Session</Radio>
  </div>
  {#if loading}
    <div class='flex w-full items-center justify-center' style='height: 80vh'>
      <Spinner size='8' />
    </div>
  {:else}
    <div class="flex flex-wrap flex-none gap-2">
      {#each showingCards as card, i}
        <Card href={hrefOf(card)} img={card.image} class='w-52 card {borderColor(card)} border-2' padding='none' style="--grad: {grad(card)};" on:click={onClick(card.path)}>
          <div class='px-2 py-0'>
            <h2 class='italic text-xs text-stone-100'>{cardType(card)}</h2>
          </div>
          <div class="flex items-center justify-center p-1 text-stone-50 font-bold">
            <h2 id={`card${i}`} class='text-ellipsis max-w-full overflow-hidden whitespace-nowrap'>{card.name}</h2>
          </div>
          {#if card.name.length > 19}
            <Popover class='w-auto h-9 text-sm z-30' triggeredBy={`#card${i}`}>
              <span>{card.name}</span>
            </Popover>
          {/if}
        </Card>
      {/each}
    </div>
  {/if}
</main>

<style>
  :global(.card) {
    position: relative;
    background-image: var(--grad);
  }

  :global(.card img) {
    max-width: fit-content;
    mask-image: 
      linear-gradient(to top, black 0%, black 100%),
      linear-gradient(170deg, black 0%, transparent 55%),                              /* for card type */
      linear-gradient(to bottom, transparent 0%,rgba(0, 0, 0, 0.8) 80%, black 100%); /* for card name */
    mask-position:
      center,
      top left,
      bottom;
    mask-size:
      100% 100%,
      70% 1.8rem,
      100% 1.8rem;
    mask-repeat:
      no-repeat,
      no-repeat,
      no-repeat;
    mask-composite:
      subtract,
      add,
      add;
    border-radius: 0.5rem;
  }

  :global(.card > div) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: -1px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
</style>