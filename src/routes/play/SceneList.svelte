<script lang="ts">
  import Scene from './Scene.svelte'
  import { dialogues } from '$lib/store'
</script>

{#each $dialogues as scene (scene.id)}
  <Scene {scene} />
{/each}
