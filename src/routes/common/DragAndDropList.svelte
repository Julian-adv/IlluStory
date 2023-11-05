<script lang="ts">
  import { flip } from 'svelte/animate'

  export let items: any[] = []
  export let itemClass = ''
  export let animationDuration = 300
  export let onChange = () => {}
  export let removesItems = false

  function onDragEnter(ev: DragEvent) {
    ev.preventDefault()
  }

  function inRect(x: number, y: number, rect: DOMRect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }

  function inUpperRect(y: number, rect: DOMRect, height: number) {
    return y < rect.top + height
  }

  function inLowerRect(y: number, rect: DOMRect, height: number) {
    return y > rect.bottom - height
  }

  let animating = false
  let modified = false

  function onDragOver(ev: DragEvent) {
    ev.preventDefault()
    if (animating) return
    const dragList = document.querySelector('.drag-list')
    if (!dragList) return
    const draggingItem = document.querySelector('.dragging')
    if (!draggingItem) return
    const siblings = [...dragList.querySelectorAll('.drag-item')]
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
      const originHeight = draggingItem.getBoundingClientRect().height
      const targetRect = siblings[target].getBoundingClientRect()
      const rule = items[origin]
      if (target > origin && inLowerRect(ev.clientY, targetRect, originHeight)) {
        target++
        items = [
          ...items.slice(0, origin),
          ...items.slice(origin + 1, target),
          rule,
          ...items.slice(target)
        ]
        modified = true
      } else if (target < origin && inUpperRect(ev.clientY, targetRect, originHeight)) {
        items = [
          ...items.slice(0, target),
          rule,
          ...items.slice(target, origin),
          ...items.slice(origin + 1)
        ]
        modified = true
      }
      // dragList.insertBefore(draggingItem, siblings[target])
      animating = true
      setTimeout(() => (animating = false), animationDuration)
    }
  }

  function onDragStart(ev: DragEvent) {
    const item = ev.currentTarget as HTMLElement
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move'
    }
    setTimeout(() => item.classList.add('dragging'), 0)
  }

  function onDragEnd(ev: DragEvent) {
    const item = ev.currentTarget as HTMLElement
    item.classList.remove('dragging')
    if (modified) {
      onChange()
      modified = false
    }
  }

  function removeItem(i: number) {
    return () => {
      items = [...items.slice(0, i), ...items.slice(i + 1)]
      onChange()
    }
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="drag-list" on:dragover={onDragOver} on:dragenter={onDragEnter}>
  {#each items as item, i (item.id)}
    <div
      class="drag-item flex"
      draggable="true"
      on:dragstart={onDragStart}
      on:dragend={onDragEnd}
      animate:flip={{ duration: animationDuration }}>
      <div class={itemClass + ' w-full'}>
        <slot {item} {i} />
      </div>
      <div class="w-8 flex justify-center items-center">
        {#if removesItems}
          <button on:click={removeItem(i)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5 stroke-stone-400">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  {/each}
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
