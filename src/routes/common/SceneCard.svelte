<script lang="ts">
  import type { FirstScene } from '$lib/interfaces'
  import { Button, Card } from 'flowbite-svelte'

  export let scene: FirstScene
  export let onSceneClick = (_ev: Event) => {}
  export let onEditScene = (_ev: Event) => {}
</script>

<Card img={scene.image} class="w-[36rem] max-w-xl" padding="none" on:click={onSceneClick}>
  <div class="flex items-center justify-center p-3">
    <h2>{scene.title}</h2>
    <Button
      color="alternative"
      class="w-6 h-6 ml-3 p-0 z-20 text-stone-300 border-0 focus:ring-0 hover:bg-transparent"
      on:click={onSceneClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
      </svg>
    </Button>
    <Button
      color="alternative"
      class="w-6 h-6 ml-3 p-0 z-20 text-stone-300 border-0 focus:ring-0 hover:bg-transparent"
      on:click={onEditScene}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    </Button>
  </div>
</Card>
