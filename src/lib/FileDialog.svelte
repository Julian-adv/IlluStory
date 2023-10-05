<script lang="ts">
  import { Button, Input, Label, Modal } from 'flowbite-svelte'
  import { onMount } from 'svelte'
  import { tcReadDir } from './tauriCompat'
  import CommonCard from './CommonCard.svelte'
  import type { StoryCard } from './interfaces'
  import { cardFromPath } from './card'

  export let openDialog = false
  export let ext = ''
  let cards: StoryCard[] = []

  onMount(async () => {
    const entries = await tcReadDir('')
    cards = await Promise.all(
      entries.map(entry => {
        return cardFromPath(entry.path)
      })
    )
  })
</script>

<Modal title="Save" bind:open={openDialog} autoclose>
  <div class="grid grid-cols-4 gap-2">
    {#each cards as card}
      <CommonCard {card} />
    {/each}
  </div>
  <div class="flex items-center">
    <Label class="w-28">
      <span>File Name</span></Label>
    <Input /><span class="p-2">{ext}</span>
  </div>
  <svelte:fragment slot="footer">
    <Button>Save</Button>
    <Button color="alternative">Cancel</Button>
  </svelte:fragment>
</Modal>
