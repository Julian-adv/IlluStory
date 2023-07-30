<script lang="ts">
  import Markdown from "../Markdown.svelte";
  import { sendChat } from "$lib/api"
  import { sessionPath, story, scenes, usage } from "$lib/store";
  import { writeTextFile } from "@tauri-apps/api/fs";
  import { newSceneId } from "$lib";

  export let role = 'user';

  function saveScenes() {
    if ($sessionPath !== '') {
      writeTextFile($sessionPath, JSON.stringify($scenes))
    }
  }

  async function onEnter(markdown: string) {
    const trimmed = markdown.trim()
    const newScene = {
      id: newSceneId($scenes),
      role: role,
      content: trimmed
    }
    $scenes = [...$scenes, newScene];
    [$scenes, $usage] = await sendChat($story, $scenes);
    saveScenes();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div>
  <Markdown readOnly={false} onEnter={onEnter} />
</div>

<style lang="postcss">
  /* Disable some style from ProseMirror */
  :global(:focus-visible) {
    outline: 0px;
  }
</style>