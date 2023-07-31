<script lang="ts">
import Scene from "./Scene.svelte";
import { scenes } from "$lib/store";
</script>

{#each $scenes as scene (scene.id)}
  <Scene {scene}/>
{/each}
