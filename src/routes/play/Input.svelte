<script lang="ts">
  import Markdown from "../Markdown.svelte";
  import { sendChat } from "$lib/api"
  import { sessionPath, openAiApiKey, openAiModel, scenes, usage } from "$lib/store";
  import { writeTextFile } from "@tauri-apps/api/fs";

  export let role = 'user';

  function saveScenes() {
    if ($sessionPath !== '') {
      writeTextFile($sessionPath, JSON.stringify($scenes))
    }
  }

  async function onEnter(markdown: string) {
    const trimmed = markdown.trim()
    const newScene = {
      id: $scenes[$scenes.length - 1].id + 1,
      role: role,
      content: trimmed
    }
    $scenes = [...$scenes, newScene];
    [$scenes, $usage] = await sendChat($scenes, $openAiApiKey, $openAiModel)
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