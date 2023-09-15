<script lang="ts">
  import type { StoryCard } from '$lib/interfaces'
  import CommonCard from './CommonCard.svelte'

  export let cards: StoryCard[] = []
  export let onRemove: (index: number) => void = () => {}
</script>

<div class="flex flex-wrap flex-none gap-2">
  {#each cards as card, i}
    <CommonCard {card} onRemove={() => onRemove(i)} />
  {/each}
</div>
