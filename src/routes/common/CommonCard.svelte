<script lang="ts">
  import { getUniqueId } from '$lib'
  import { emptyCard } from '$lib/charSettings'
  import { charExt, extOf, presetExt, sceneExt, sessionExt } from '$lib/fs'
  import type { StoryCard } from '$lib/interfaces'
  import { Card, Popover } from 'flowbite-svelte'

  export let card = emptyCard
  const id = getUniqueId()

  function cardSize(card: StoryCard) {
    const ext = extOf(card.path)
    if (ext === sceneExt || ext === sessionExt) {
      return 'w-[424px] h-[310px] card-wide'
    }
    return 'w-52 h-[310px] card'
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

  function onClick(_card: StoryCard) {
    return (_ev: Event) => {}
  }

  function onTrash(_card: StoryCard) {
    return (_ev: Event) => {}
  }
</script>

<Card
  img={card.image}
  class="{cardSize(card)} {borderColor(card)} flex justify-center border-2 cursor-pointer max-w-xl"
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
    <h2 id={`card${id}`} class="text-ellipsis max-w-full overflow-hidden whitespace-nowrap">
      {card.name}
    </h2>
  </div>
  {#if card.name.length > 19}
    <Popover class="w-auto h-auto text-sm z-30" triggeredBy={`#card${id}`}>
      <span>{card.name}</span>
    </Popover>
  {/if}
</Card>

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
