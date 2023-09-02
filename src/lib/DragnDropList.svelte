<script lang="ts">
  import { flip } from 'svelte/animate'
  import { dndzone } from 'svelte-dnd-action'
  import type { SceneType } from './interfaces'

  export let items: SceneType[] = []
  export let removesItems = false
  export let onChange = (_data: SceneType[]) => {}

  const flipDurationMs = 300

  function handleDndConsider(e) {
    items = e.detail.items
  }
  function handleDndFinalize(e) {
    items = e.detail.items
    onChange(items)
  }

  function moveItem(from: number, to: number) {
    let temp = items[from]
    items = [...items.slice(0, from), ...items.slice(from + 1)]
    items = [...items.slice(0, to), temp, ...items.slice(to)]
    onChange(items)
  }

  function removeItem(index: number) {
    items = [...items.slice(0, index), ...items.slice(index + 1)]
    onChange(items)
  }
</script>

<section
  use:dndzone={{ items, flipDurationMs }}
  on:consider={handleDndConsider}
  on:finalize={handleDndFinalize}
  class="list">
  {#each items as item, i (item.id)}
    <div animate:flip={{ duration: flipDurationMs }} class="item">
      <div class="buttons">
        <button
          class="up"
          style={'visibility: ' + (i > 0 ? '' : 'hidden') + ';'}
          on:click={function (_ev) {
            moveItem(i, i - 1)
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"
            ><path d="M0 0h24v24H0V0z" fill="none" /><path
              d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" /></svg>
        </button>
        <button
          class="down"
          style={'visibility: ' + (i < items.length - 1 ? '' : 'hidden') + ';'}
          on:click={function (_ev) {
            moveItem(i, i + 1)
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"
            ><path d="M0 0h24v24H0V0z" fill="none" /><path
              d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" /></svg>
        </button>
      </div>
      <div class="content w-full">
        <slot {item} {i} />
      </div>
      <div class="buttons delete">
        {#if removesItems}
          <button
            on:click={function (_ev) {
              removeItem(i)
            }}>
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
</section>

<style>
  /* section {
    width: 100%;
    padding: 0.3em;
    border: 1px solid black;
    this will allow the dragged element to scroll the list
    overflow: scroll;
    height: 200px;
  } */
  /* div {
    width: 50%;
    padding: 0.2em;
    border: 1px solid blue;
    margin: 0.15em 0;
  } */
  .list {
    cursor: grab;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .item {
    box-sizing: border-box;
    display: inline-flex;
    width: 100%;
    min-height: 3em;
    /* background-color: white; */
    border-top: 1px dashed rgb(190, 190, 190);
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    /* border-radius: 2px; */
    user-select: none;
  }

  .item:last-child {
    border-bottom: 1px dashed rgb(190, 190, 190);
  }

  .buttons {
    width: 32px;
    min-width: 32px;
    margin: auto 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
