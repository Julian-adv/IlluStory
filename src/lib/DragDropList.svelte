<!-- This file is copied from https://github.com/jwlarocque/svelte-dragdroplist -->
<script lang="ts">
  import {flip} from "svelte/animate";
  
  export let data:any = [];
  export let removesItems = false;
  export let onChange = (data:[]) => {};

  let ghost:HTMLElement;
  let grabbed:HTMLElement|null;

  let lastTarget:Element;

  let mouseY = 0; // pointer y coordinate within client
  let offsetY = 0; // y distance from top of grabbed element to pointer
  let layerY = 0; // distance from top of list to top of client

  let changed = false;

  function grab(clientY:number, element:HTMLElement, target:HTMLElement) {
      if (target.nodeName === 'TEXTAREA') {
        return;
      }
      // modify grabbed element
      grabbed = element;
      grabbed.dataset.grabY = clientY.toString();

      // modify ghost element (which is actually dragged)
      if (ghost.firstChild) {
        ghost.replaceChild(grabbed.cloneNode(true), ghost.firstChild);
      }

      // record offset from cursor to top of element
      // (used for positioning ghost)
      offsetY = grabbed.getBoundingClientRect().y - clientY;
      drag(clientY);
  }

  // drag handler updates cursor position
  function drag(clientY:number) {
      if (grabbed) {
          mouseY = clientY;
          const parent = ghost.parentNode as HTMLElement;
          layerY = parent.getBoundingClientRect().y;
      }
  }

  // touchEnter handler emulates the mouseenter event for touch input
  // (more or less)
  function touchEnter(ev:Touch) {       
      drag(ev.clientY);
      // trigger dragEnter the first time the cursor moves over a list item
      let target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".item") as HTMLElement;
      if (target && target != lastTarget) {
          lastTarget = target;
          dragEnter(target);
      }
  }

  function dragEnter(target:HTMLElement) {
      // swap items in data
      if (grabbed && target != grabbed && target.classList.contains("item")) {
          moveDatum(parseInt(grabbed.dataset.index as string), parseInt(target.dataset.index as string));
      }
  }

  // does the actual moving of items in data
  function moveDatum(from:number, to:number) {
      let temp = data[from];
      data = [...data.slice(0, from), ...data.slice(from + 1)];
      data = [...data.slice(0, to), temp, ...data.slice(to)];
      changed = true;
  }

  function release() {
      grabbed = null;
      if (changed) {
        onChange(data);
        changed = false;
      }
  }

  function removeDatum(index:number) {
      data = [...data.slice(0, index), ...data.slice(index + 1)];
      onChange(data);
      changed = false;
  }
</script>

<style>
  main {
      position: relative;
  }

  .list {
      cursor: grab;
      z-index: 5;
      display: flex;
      flex-direction: column;
      width: 100%;
  }

  .item {
      box-sizing: border-box;
      display: inline-flex;
      width: 100%;
      min-height: 3em;
      margin-bottom: 0.5em;
      /* background-color: white; */
      /* border: 1px solid rgb(190, 190, 190); */
      /* border-radius: 2px; */
      user-select: none;
  }

  .item:last-child {
      margin-bottom: 0;
  }

  .item:not(#grabbed):not(#ghost) {
      z-index: 10;
  }

  .item > * {
      margin: 0;
  }

  .buttons {
      width: 32px;
      min-width: 32px;
      margin: auto 0;
      display: flex;
      flex-direction: column;
  }

  .buttons button {
      cursor: pointer;
      width: 18px;
      height: 18px;
      margin: 0 auto;
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0);
      background-color: inherit;
  }

  .buttons button:focus {
      border: 1px solid black;
  }

  .delete {
      width: 32px;
  }

  #grabbed {
      opacity: 0.0;
  }

  #ghost {
      pointer-events: none;
      z-index: -5;
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.0;
  }

  #ghost * {
      pointer-events: none;
  }

  #ghost.haunting {
      z-index: 20;
      opacity: 1.0;
  }
</style>

<!-- All the documentation has to go up here, sorry.
   (otherwise it conflicts with the HTML or svelte/animate) 
   The .list has handlers for pointer movement and pointer up/release/end.
   Each .item has a handler for pointer down/click/start, which assigns that
   element as the item currently being "grabbed".  They also have a handler
   for pointer enter (the touchmove handler has extra logic to behave like the
   no longer extant 'touchenter'), which swaps the entered element with the
   grabbed element when triggered.
   You'll also find reactive styling below, which keeps it from being directly
   part of the imperative javascript handlers. -->
<main class="dragdroplist">
  <div 
      bind:this={ghost}
      id="ghost"
      class={grabbed ? "item haunting" : "item"}
      style={"top: " + (mouseY + offsetY - layerY) + "px"}><p></p></div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
      class="list"
      on:mousemove={function(ev) {ev.stopPropagation(); drag(ev.clientY);}}
      on:touchmove={function(ev) {ev.stopPropagation(); drag(ev.touches[0].clientY);}}
      on:mouseup={function(ev) {ev.stopPropagation(); release();}}
      on:touchend={function(ev) {ev.stopPropagation(); release();}}>
      {#each data as datum, i (datum.id ? datum.id : JSON.stringify(datum))}
          <div 
              id={(grabbed && (datum.id ? datum.id : JSON.stringify(datum)) == grabbed.dataset.id) ? "grabbed" : ""}
              class="item"
              data-index={i}
              data-id={(datum.id ? datum.id : JSON.stringify(datum))}
              data-grabY="0"
              on:mousedown={function(ev) {grab(ev.clientY, this, ev.target);}}
              on:touchstart={function(ev) {grab(ev.touches[0].clientY, this, ev.target);}}
              on:mouseenter={function(ev) {ev.stopPropagation(); dragEnter(ev.target);}}
              on:touchmove={function(ev) {ev.stopPropagation(); ev.preventDefault(); touchEnter(ev.touches[0]);}}
              animate:flip|local={{duration: 200}}>
              <div class="buttons">
                  <button 
                      class="up" 
                      style={"visibility: " + (i > 0 ? "" : "hidden") + ";"}
                      on:click={function(ev) {moveDatum(i, i - 1)}}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
                  </button>
                  <button 
                      class="down" 
                      style={"visibility: " + (i < data.length - 1 ? "" : "hidden") + ";"}
                      on:click={function(ev) {moveDatum(i, i + 1)}}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                  </button>
              </div>

              <div class="content w-full">
                  {#if datum.html}
                      {@html datum.html}
                  {:else if datum.text}
                      <p>{datum.text}</p>
                  {:else}
                      <slot {datum} {i} />
                  {/if}
              </div>

              <div class="buttons delete">
                  {#if removesItems}
                      <button
                          on:click={function(ev) {removeDatum(i);}}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 stroke-stone-400">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                      </button>
                  {/if}
              </div>
          </div>
      {/each}
  </div>
</main>