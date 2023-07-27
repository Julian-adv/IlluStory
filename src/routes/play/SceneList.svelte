<script lang="ts">
import Scene from "../Scene.svelte";
import type { SceneType } from "$lib/interfaces";
import { scenes } from "$lib/store";
</script>

{#each $scenes as scene (scene.id)}
  <Scene {scene}/>
{/each}
