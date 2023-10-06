<script lang="ts">
  import { Button, Input, Label, Modal } from 'flowbite-svelte'
  import { tcReadDir } from './tauriCompat'
  import CommonCard from './CommonCard.svelte'
  import type { StoryCard } from './interfaces'
  import { cardFromPath } from './card'
  import { basenameOf } from './fs'

  export let openDialog = false
  export let ext = ''
  export let value = ''
  let cards: StoryCard[] = []

  function onClick(card: StoryCard) {
    value = basenameOf(card.path)
  }

  function onOk() {
    openDialog = false
  }

  function onCancel() {
    value = ''
    openDialog = false
  }

  function onKeyDown(ev: KeyboardEvent) {
    if (ev.code === 'Enter') {
      openDialog = false
    }
  }

  async function readCards(openDialog: boolean) {
    if (openDialog) {
      const entries = await tcReadDir('')
      const dotExt = '.' + ext
      cards = await Promise.all(
        entries
          .filter(entry => entry.name?.endsWith(dotExt))
          .map(entry => {
            return cardFromPath(entry.path)
          })
      )
      cards = cards
    }
  }

  $: readCards(openDialog)
</script>

<Modal title="Save" bind:open={openDialog} autoclose>
  <div class="grid grid-cols-4 gap-2">
    {#each cards as card}
      <CommonCard {card} {onClick} />
    {/each}
  </div>
  <div class="flex items-center">
    <Label class="w-28">
      <span>File Name</span></Label>
    <Input bind:value on:keydown={onKeyDown} /><span class="p-2">.{ext}</span>
  </div>
  <svelte:fragment slot="footer">
    <Button on:click={onOk}>Save</Button>
    <Button on:click={onCancel} color="alternative">Cancel</Button>
  </svelte:fragment>
</Modal>
