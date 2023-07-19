<script lang="ts">
  import Markdown from "./Markdown.svelte";
  import { chat } from "$lib/api"

  export let value = '';
  export let scenes;
  export let updateScenes;

  function onEnter(markdown: string) {
    const trimmed = markdown.trim()
    chat(scenes, trimmed, updateScenes)
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class='mt-5'>
  <Markdown readOnly={false} onEnter={onEnter} bind:value />
</div>

<style lang="postcss">
  /* Disable some style from ProseMirror */
  :global(:focus-visible) {
    outline: 0px;
  }
</style>