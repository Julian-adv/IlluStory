<script lang="ts">
import Scene from "./Scene.svelte";
import { initialScenes, additionalScenes } from "$lib/store";
</script>

{#each $initialScenes as scene (scene.id)}
  <Scene {scene}/>
{/each}
{#each $additionalScenes as scene (scene.id)}
  <Scene {scene}/>
{/each}
