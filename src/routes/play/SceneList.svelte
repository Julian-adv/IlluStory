<script lang="ts">
import Scene from "./Scene.svelte"
import { initialScenes, additionalScenes, firstSceneIndex } from "$lib/store"
</script>

{#each $initialScenes.slice($firstSceneIndex) as scene (scene.id)}
  <Scene {scene}/>
{/each}
{#each $additionalScenes as scene (scene.id)}
  <Scene {scene}/>
{/each}
