<script lang="ts">
import type { SceneType } from "$lib/interfaces";
import Scene from "./Scene.svelte";

export let scenes: SceneType[];

</script>

{#each scenes as scene (scene.id)}
  <Scene {scene}/>
{/each}
