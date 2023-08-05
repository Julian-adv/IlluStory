<script lang="ts">
  import Markdown from "../Markdown.svelte";
  import { sendChat } from "$lib/api"
  import { sessionPath, story, initialScenes, additionalScenes, usage, userName } from "$lib/store";
  import { writeTextFile } from "@tauri-apps/api/fs";
  import { newSceneId } from "$lib";

  export let role = 'user';
  export let value = '';

  function saveScenes() {
    if ($sessionPath !== '') {
      writeTextFile($sessionPath, JSON.stringify($additionalScenes))
    }
  }

  function received(text: string) {
    $additionalScenes[$additionalScenes.length - 1].content += text;
    $additionalScenes[$additionalScenes.length - 1].done = false;
  }

  function closedCb() {
    $additionalScenes[$additionalScenes.length - 1].done = true;
  }

  async function onEnter(markdown: string) {
    const trimmed = markdown.trim()
    const newScene = {
      id: newSceneId($initialScenes, $additionalScenes),
      role: role,
      content: `${$userName}: ` + trimmed,
      done: false
    }
    $additionalScenes = [...$additionalScenes, newScene];
    const scenes = [...$initialScenes, ...$additionalScenes];
    let addedScene;
    [addedScene, $usage] = await sendChat($story, scenes, received, closedCb);
    if (addedScene) {
      addedScene.id = newSceneId($initialScenes, $additionalScenes);
      $additionalScenes = [...$additionalScenes, addedScene];
    }
    saveScenes();
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div>
  <Markdown bind:value={value} readOnly={false} onEnter={onEnter} />
</div>

<style>
  /* Disable some style from ProseMirror */
  :global(:focus-visible) {
    outline: 0px;
  }
</style>