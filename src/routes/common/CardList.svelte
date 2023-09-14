<script lang="ts">
  import type { StoryCard } from '$lib/interfaces'
  import CommonCard from './CommonCard.svelte'

  export let cards: StoryCard[] = []
</script>

<div class="flex flex-wrap flex-none gap-2">
  {#each cards as card}
    <CommonCard {card} />
  {/each}
</div>
