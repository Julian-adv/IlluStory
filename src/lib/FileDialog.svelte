<script lang="ts">
  import { Button, Input, Label, Modal } from 'flowbite-svelte'
  import { tcMetadata, tcReadDir } from './tauriCompat'
  import CommonCard from './CommonCard.svelte'
  import type { StoryCard } from './interfaces'
  import { cardFromPath } from './card'
  import { basenameOf, dirnameOf } from './fs'

  export let openDialog = false
  export let ext = ''
  export let value = ''
  export let title = ''
  let cards: StoryCard[] = []
  let fileName = ''
  let dir = ''

  function onClick(card: StoryCard) {
    fileName = basenameOf(card.path)
  }

  function onOk() {
    value = (dir ? dir + '/' : '') + fileName + '.' + ext
    openDialog = false
  }

  function onCancel() {
    value = ''
    openDialog = false
  }

  function onKeyDown(ev: KeyboardEvent) {
    if (ev.code === 'Enter') {
      onOk()
    }
  }

  async function readCards() {
    let meta = await tcMetadata(value)
    if (meta.isDir) {
      dir = value
      fileName = ''
    } else {
      dir = dirnameOf(value)
      fileName = basenameOf(value)
    }
    const entries = await tcReadDir(dir)
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

  $: if (openDialog) {
    readCards()
  }
</script>

<Modal {title} bind:open={openDialog} autoclose>
  <div class="grid grid-cols-4 gap-2">
    {#each cards as card}
      <CommonCard {card} {onClick} />
    {/each}
  </div>
  <div class="flex items-center">
    <Label class="w-28">
      <span>File Name</span></Label>
    <Input bind:value={fileName} on:keydown={onKeyDown} /><span class="p-2">.{ext}</span>
  </div>
  <svelte:fragment slot="footer">
    <Button on:click={onOk}>{title}</Button>
    <Button on:click={onCancel} color="alternative">Cancel</Button>
  </svelte:fragment>
</Modal>
