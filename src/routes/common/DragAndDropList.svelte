<script lang="ts">
  import { flip } from 'svelte/animate'

  export let items: any[] = []
  export let itemClass = ''
  export let animationDuration = 300

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
      } else if (target < origin && inUpperRect(ev.clientY, targetRect, originHeight)) {
        items = [
          ...items.slice(0, target),
          rule,
          ...items.slice(target, origin),
          ...items.slice(origin + 1)
        ]
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
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="drag-list" on:dragover={onDragOver} on:dragenter={onDragEnter}>
  {#each items as item, i (item.id)}
    <div
      class={itemClass + ' drag-item'}
      draggable="true"
      on:dragstart={onDragStart}
      on:dragend={onDragEnd}
      animate:flip={{ duration: animationDuration }}>
      <slot {item} {i} />
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
