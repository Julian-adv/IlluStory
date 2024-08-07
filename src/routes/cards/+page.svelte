<script lang="ts" context="module">
  let cards: StoryCard[] = []
  let unlisten: UnlistenFn
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '$lib/settings'
  import {
    Button,
    Card,
    Dropdown,
    DropdownItem,
    Popover,
    Radio,
    Spinner,
    Toast
  } from 'flowbite-svelte'
  import { ChevronDownOutline, InfoCircleSolid } from 'flowbite-svelte-icons'
  import { FileType, SortOrder, SortType, type StoryCard } from '$lib/interfaces'
  import {
    preset,
    presetPath,
    settings,
    curCharPath,
    curChar,
    sessionPath,
    curScenePath,
    curScene,
    session
  } from '$lib/store'
  import { extOf, allExts, presetExt, charExt, sessionExt, sceneExt } from '$lib/fs'
  import { goto } from '$app/navigation'
  import { loadChar } from '$lib/charSettings'
  import { loadSession } from '$lib/session'
  import { slide } from 'svelte/transition'
  import { loadScene } from '$lib/scene'
  import { loadPreset } from '$lib/preset'
  import { cardFromPath } from '$lib/card'
  import { tcLog, tcReadDir } from '$lib/tauriCompat'

  let showingCards: StoryCard[] = []
  let extFlag = FileType.All
  let loading = false
  let working = false

  async function reloadCards() {
    working = true
    cards = []
    const entries = await tcReadDir('.')
    for (const entry of entries) {
      if (entry.name) {
        const ext = extOf(entry.name)
        if (allExts.includes(ext)) {
          const card = await cardFromPath(entry.path)
          cards.push(card)
        }
      }
    }
    resort()
    showingCards = filterExt(extFlag)
    working = false
  }

  onMount(async () => {
    if (cards.length > 0) {
      return
    }
    await loadSettings()

    loading = true
    reloadCards()
    loading = false
    if (!unlisten) {
      invoke('start_watch', { path: '' }).catch(err => tcLog('ERROR', err))
      unlisten = await listen<string>('change', _event => {
        if (!working) {
          reloadCards()
        }
      })
    }
  })

  let toastOpen = false

  function closeToast() {
    toastOpen = false
  }

  function showToast() {
    toastOpen = true
    setTimeout(closeToast, 3000)
  }

  function onClick(card: StoryCard) {
    return async (_ev: Event) => {
      const ext = extOf(card.path)
      if (ext === presetExt) {
        const tempPreset = await loadPreset(card.path)
        if (tempPreset) {
          $presetPath = card.path
          $preset = tempPreset
          // cardFromPreset($preset, $presetPath)
          goto('/write')
        }
      } else if (ext === charExt) {
        const tempChar = await loadChar(card.path)
        if (tempChar) {
          $curCharPath = card.path
          $curChar = tempChar
          goto('/write_char')
        }
      } else if (ext === sceneExt) {
        const tempScene = await loadScene(card.path)
        if (tempScene) {
          $curScenePath = card.path
          $curScene = tempScene
          goto('/write_scene')
        }
      } else if (ext === sessionExt) {
        if (!$presetPath) {
          showToast()
        } else {
          const tempSession = await loadSession(card.path)
          if (tempSession) {
            $session = tempSession
            $sessionPath = card.path
            goto('/play')
          }
        }
      }
    }
  }

  let sortOpen = false

  function resort() {
    if ($settings.sortType === SortType.Name) {
      cards.sort((cardA, cardB) => {
        if (cardA.name > cardB.name) {
          return $settings.sortOrder === SortOrder.Ascending ? 1 : -1
        }
        if (cardA.name < cardB.name) {
          return $settings.sortOrder === SortOrder.Ascending ? -1 : 1
        }
        return 0
      })
    }
    if ($settings.sortType === SortType.Date) {
      cards.sort((cardA, cardB) => {
        if (cardA.modifiedAt > cardB.modifiedAt) {
          return $settings.sortOrder === SortOrder.Ascending ? 1 : -1
        }
        if (cardA.modifiedAt < cardB.modifiedAt) {
          return $settings.sortOrder === SortOrder.Ascending ? -1 : 1
        }
        return 0
      })
    }
    showingCards = filterExt(extFlag)
  }

  function changeSortType(newSortType: SortType) {
    sortOpen = false
    $settings.sortType = newSortType
    resort()
    saveSettings()
  }

  function toggleSortOrder() {
    if ($settings.sortOrder === SortOrder.Ascending) {
      $settings.sortOrder = SortOrder.Descending
    } else {
      $settings.sortOrder = SortOrder.Ascending
    }
    resort()
    saveSettings()
  }

  function filterExt(flag: number) {
    return cards.filter(card => {
      const ext = extOf(card.path)
      if (ext === presetExt && flag === FileType.Preset) {
        return true
      } else if (ext === sessionExt && flag === FileType.Session) {
        return true
      } else if (ext === charExt && flag === FileType.Char) {
        return true
      } else if (flag === FileType.All) {
        return true
      }
      return false
    })
  }

  $: showingCards = filterExt(extFlag)

  function cardType(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === presetExt) {
      return 'Preset'
    } else if (ext === sessionExt) {
      return 'Session'
    } else if (ext === charExt) {
      return 'Character'
    } else if (ext === sceneExt) {
      return 'Scene'
    }
    return 'Unknown'
  }

  function grad(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === presetExt) {
      return 'linear-gradient(to bottom, #1e293b 60%, #020617 100%)' // slate
    } else if (ext === sessionExt) {
      return 'linear-gradient(to bottom, #075985 60%, #082f49 100%)' // sky 800 ~ 950
    } else if (ext === charExt) {
      return 'linear-gradient(to bottom, #955858 60%, #3d1923 100%)' // rose
    } else if (ext === sceneExt) {
      return 'linear-gradient(to bottom, #9ca3af 60%, #374151 100%)' // gray 400 ~ 700
    }
    return 'linear-gradient(to bottom, gray 60%, black 100%)'
  }

  function borderColor(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === presetExt) {
      return 'border-slate-400'
    } else if (ext === sessionExt) {
      return 'border-sky-700'
    } else if (ext === charExt) {
      return 'border-rose-300'
    } else if (ext === sceneExt) {
      return 'border-gray-500'
    }
    return 'linear-gradient(to bottom, gray 60%, black 100%)'
  }

  function cardSize(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === sceneExt || ext === sessionExt) {
      return 'w-[424px] h-[310px] card-wide'
    }
    return 'w-52 h-[310px] card'
  }

  function _isOverflowed(id: string) {
    const elem = document.getElementById(id)
    if (elem && elem.scrollWidth > elem.clientWidth) {
      return true
    }
    return false
  }

  function onTrash(card: StoryCard) {
    return async (ev: Event) => {
      ev.stopPropagation()
      let result = await invoke('trash_delete', { path: card.path })
      if (result === 'Ok') {
        const index = showingCards.findIndex(c => c.path === card.path)
        if (index >= 0) {
          showingCards.splice(index, 1)
          showingCards = showingCards
        }
      } else {
        alert(`Error can't move the card "${card.path}" to trash.`)
      }
    }
  }
</script>

<main class="px-4">
  <div class="my-1 flex gap-2">
    <Button color="alternative" size="sm">
      {$settings.sortType}
      <ChevronDownOutline
        class="w-3 h-3 ml-2 text-gray-900 dark:text-white focus:outline-none" /></Button>
    <Dropdown bind:open={sortOpen}>
      <DropdownItem
        on:click={() => {
          changeSortType(SortType.Name)
        }}>Name</DropdownItem>
      <DropdownItem
        on:click={() => {
          changeSortType(SortType.Date)
        }}>Modified Date</DropdownItem>
    </Dropdown>
    <Button color="alternative" size="sm" on:click={toggleSortOrder}>
      {#if $settings.sortOrder === SortOrder.Ascending}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
        </svg>
      {/if}
    </Button>
    <Radio bind:group={extFlag} value={FileType.All}>All</Radio>
    <Radio bind:group={extFlag} value={FileType.Preset}>Preset</Radio>
    <Radio bind:group={extFlag} value={FileType.Char}>Character</Radio>
    <Radio bind:group={extFlag} value={FileType.Scene}>Scene</Radio>
    <Radio bind:group={extFlag} value={FileType.Session}>Session</Radio>
  </div>
  {#if loading}
    <div class="flex w-full items-center justify-center" style="height: 80vh">
      <Spinner size="8" />
    </div>
  {:else}
    <div class="relative">
      <Toast
        color="purple"
        transition={slide}
        bind:open={toastOpen}
        class="fixed mx-auto my-8 top-auto inset-x-0 z-30">
        <InfoCircleSolid name="info-circle-solid" slot="icon" class="w-4 h-4" />
        Load preset first.
      </Toast>
      <div class="flex flex-wrap flex-none gap-2">
        {#each showingCards as card, i}
          <Card
            img={card.image}
            class="{cardSize(card)} {borderColor(
              card
            )} flex justify-center border-2 cursor-pointer max-w-xl"
            padding="none"
            style="--grad: {grad(card)};"
            on:click={onClick(card)}>
            <div class="px-2 py-0 flex justify-between">
              <h2 class="italic text-xs text-stone-100">{cardType(card)}</h2>
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6 py-1"
                on:click={onTrash(card)}>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <div class="flex items-center justify-center p-1 text-stone-50 font-bold">
              <h2
                id={`card${i}`}
                class="text-ellipsis max-w-full overflow-hidden whitespace-nowrap">
                {card.name}
              </h2>
            </div>
            {#if card.name.length > 19}
              <Popover class="w-auto h-auto text-sm z-30" triggeredBy={`#card${i}`}>
                <span>{card.name}</span>
              </Popover>
            {/if}
          </Card>
        {/each}
      </div>
    </div>
  {/if}
</main>

<style>
  :global(.card-wide) {
    position: relative;
    background-image: var(--grad);
    align-items: center;
    overflow: hidden;
  }

  :global(.card) {
    position: relative;
    background-image: var(--grad);
  }

  :global(.card-wide img) {
    max-width: fit-content;
    max-height: 306px;
    mask-image:
      linear-gradient(to top, black 0%, black 100%),
      /* for card type */ linear-gradient(170deg, black 0%, transparent 55%),
      /* for card name */ linear-gradient(to bottom, transparent 0%, black 100%);
    mask-position:
      center,
      top left,
      bottom;
    mask-size:
      100% 100%,
      70% 1.8rem,
      100% 32px;
    mask-repeat: no-repeat, no-repeat, no-repeat;
    mask-composite: subtract, add, add;
    border-top-right-radius: 0;
    border-top-left-radius: 0;
  }

  :global(.card img) {
    max-width: fit-content;
    mask-image:
      linear-gradient(to top, black 0%, black 100%),
      /* for card type */ linear-gradient(170deg, black 0%, transparent 55%),
      /* for card name */ linear-gradient(to bottom, transparent 0%, black 100%);
    mask-position:
      center,
      top left,
      bottom;
    mask-size:
      100% 100%,
      70% 1.8rem,
      100% 32px;
    mask-repeat: no-repeat, no-repeat, no-repeat;
    mask-composite: subtract, add, add;
    border-radius: 0.5rem;
  }

  :global(.card-wide > div) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: -1px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
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
