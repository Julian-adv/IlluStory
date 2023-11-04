<script lang="ts">
  import { Button, Checkbox } from 'flowbite-svelte'
  import { lorebookExt, saveObjQuietly, savePath } from '$lib/fs'
  import type { Lorebook } from '$lib/interfaces'
  import { lorebook, lorebookPath } from '$lib/store'
  import StringField from '../common/StringField.svelte'
  import ImageField from '../common/ImageField.svelte'
  import TextField from '../common/TextField.svelte'
  import { flip } from 'svelte/animate'

  let autoSave = true

  function addRule() {
    $lorebook.rules = [
      ...$lorebook.rules,
      { id: $lorebook.rules.length, condition: '', answer: '', content: '' }
    ]
  }

  function load() {}

  function importLoreBook() {}

  async function autoSaveFunc() {
    if (autoSave && $lorebookPath) {
      await saveObjQuietly($lorebookPath, $lorebook)
    }
  }

  async function saveLorebook(lorebook: Lorebook) {
    let fileName = lorebook.title.replace(/[<>:"/\\|?*]/g, '_').trim()
    if (!fileName) {
      fileName = 'lorebook' + Date.now()
    }
    fileName += '.' + lorebookExt
    return savePath(fileName, lorebookExt, lorebook)
  }

  async function save() {
    const tempFilePath = await saveLorebook($lorebook)
    if (tempFilePath) {
      $lorebookPath = tempFilePath
    }
  }

  function inRect(x: number, y: number, rect: DOMRect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }

  let animating = false
  const animationDuration = 300

  function onDragOver(ev: DragEvent) {
    ev.preventDefault()
    if (animating) return
    const dragList = document.querySelector('.drag-list')
    if (!dragList) return
    const draggingItem = document.querySelector('.dragging')
    if (!draggingItem) return
    let siblings = [...dragList.querySelectorAll('.drag-item')]
    let origin = -1
    let target = -1
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i]
      if (sibling === draggingItem) {
        origin = i
      }
      const sib = sibling as HTMLElement
      if (inRect(ev.clientX, ev.clientY, sib.getBoundingClientRect())) {
        target = i
      }
    }
    if (origin > -1 && target > -1 && origin !== target) {
      const rule = $lorebook.rules[origin]
      if (target > origin) {
        target++
        $lorebook.rules = [
          ...$lorebook.rules.slice(0, origin),
          ...$lorebook.rules.slice(origin + 1, target),
          rule,
          ...$lorebook.rules.slice(target)
        ]
      } else {
        $lorebook.rules = [
          ...$lorebook.rules.slice(0, target),
          rule,
          ...$lorebook.rules.slice(target, origin),
          ...$lorebook.rules.slice(origin + 1)
        ]
      }
      // dragList.insertBefore(draggingItem, siblings[target])
      animating = true
      setTimeout(() => (animating = false), animationDuration)
    }
  }

  function onDragEnter(ev: DragEvent) {
    ev.preventDefault()
  }

  function onDragStart(ev: DragEvent) {
    const item = ev.currentTarget as HTMLElement
    setTimeout(() => item.classList.add('dragging'), 0)
  }

  function onDragEnd(ev: DragEvent) {
    const item = ev.currentTarget as HTMLElement
    item.classList.remove('dragging')
  }
</script>

<div class="px-4">
  <h1 class="text-lg font-semibold mb-1">Lorebook</h1>
  <div class="mb-5 flex gap-2">
    <Button color="alternative" size="sm" on:click={load}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
      </svg>
      <span class="pl-2">Load</span>
    </Button>
    <Button color="alternative" size="sm" on:click={importLoreBook}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
      </svg>
      <span class="pl-2">Import</span>
    </Button>
    <Button color="alternative" size="sm" on:click={save}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <span class="pl-2">Save as ...</span>
    </Button>
    <Checkbox class="inline self-center" bind:checked={autoSave}>Auto save</Checkbox>
  </div>
  <div class="grid grid-cols-[9rem,5rem,1fr] gap-0">
    <StringField label="File path" size="sm" disabled bind:value={$lorebookPath} />
    <ImageField
      label="Image"
      help="An image to show in the preset card."
      bind:value={$lorebook.image}
      width={512}
      height={768}
      save={autoSaveFunc} />
    <StringField bind:value={$lorebook.title} label="Title" />
  </div>
  <h1 class="text-lg font-semibold mb-1 mt-3">Rules</h1>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="drag-list" on:dragover={onDragOver} on:dragenter={onDragEnter}>
    {#each $lorebook.rules as rule (rule.id)}
      <div
        class="drag-item grid grid-cols-[9rem,5rem,1fr]"
        draggable="true"
        on:dragstart={onDragStart}
        on:dragend={onDragEnd}
        animate:flip={{ duration: animationDuration }}>
        <TextField label="Condition" bind:value={rule.condition} save={autoSaveFunc} />
        <TextField label="Answer" bind:value={rule.answer} save={autoSaveFunc} />
        <TextField label="Content" bind:value={rule.content} save={autoSaveFunc} />
      </div>
    {/each}
  </div>
  <div class="h-2"></div>
  <Button size="xs" color="alternative" on:click={addRule}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  </Button>
</div>

<style>
  .drag-item {
    cursor: grab;
    border-top: 1px dashed rgb(190, 190, 190);
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .drag-item:last-child {
    border-bottom: 1px dashed rgb(190, 190, 190);
  }

  :global(.drag-item.dragging) {
    opacity: 0;
  }
</style>
