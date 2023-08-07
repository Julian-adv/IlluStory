<script lang="ts">
import Scene from "./Scene.svelte"
import { initialScenes, additionalScenes, firstSceneIndex, summarySceneIndex } from "$lib/store"
</script>

{#each $initialScenes.slice($firstSceneIndex) as scene (scene.id)}
  <Scene {scene}/>
{/each}
{#each $additionalScenes.slice($summarySceneIndex) as scene (scene.id)}
  <Scene {scene}/>
{/each}
