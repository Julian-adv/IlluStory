<script lang="ts">
  import Markdown from "./Markdown.svelte";
  import { chat } from "$lib/api"
  import type { SceneType } from "$lib/interfaces";
  import { openAiApiKey } from "$lib/store";

  export let value = '';
  export let scenes: SceneType[];
  export let updateScenes: (newScene: SceneType) => void;

  function onEnter(markdown: string) {
    const trimmed = markdown.trim()
    chat(scenes, trimmed, updateScenes, $openAiApiKey)
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='mt-2'>
  <Markdown readOnly={false} onEnter={onEnter} bind:value />
</div>

<style lang="postcss">
  /* Disable some style from ProseMirror */
  :global(:focus-visible) {
    outline: 0px;
  }
</style>