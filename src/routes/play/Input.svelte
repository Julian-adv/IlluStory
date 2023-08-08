<script lang="ts">
  import Markdown from "../Markdown.svelte"
  import { sendChat } from "$lib/api"
  import { sessionPath, story, initialScenes, additionalScenes, usage, firstSceneIndex, summarySceneIndex, replaceDict } from "$lib/store"
  import { writeTextFile } from "@tauri-apps/api/fs"
  import { newSceneId } from "$lib"

  export let role = 'user'
  export let value = ''

  function saveScenes() {
    if ($sessionPath !== '') {
      writeTextFile($sessionPath, JSON.stringify($additionalScenes))
    }
  }

  function _received(text: string) {
    $additionalScenes[$additionalScenes.length - 1].content += text
    $additionalScenes[$additionalScenes.length - 1].done = false
  }

  function _closedCb() {
    $additionalScenes[$additionalScenes.length - 1].done = true
  }

  async function onEnter(markdown: string) {
    const trimmed = markdown.trim()
    let content
    if (trimmed[0] === '"') {
      content = `${$replaceDict['user']}: ` + trimmed 
    } else {
      content = trimmed
    }
    const newScene = {
      id: newSceneId($initialScenes, $additionalScenes),
      role: role,
      content: content,
      done: false
    }
    $additionalScenes = [...$additionalScenes, newScene]
    let addedScene;
    [addedScene, $usage] = await sendChat($story, $initialScenes, $additionalScenes, false, $firstSceneIndex, $summarySceneIndex)
    if (addedScene) {
      addedScene.id = newSceneId($initialScenes, $additionalScenes)
      $additionalScenes = [...$additionalScenes, addedScene]
    }
    saveScenes()
  }
</script>

<div>
  <Markdown bind:value={value} readOnly={false} onEnter={onEnter} />
</div>

<style>
  /* Disable some style from ProseMirror */
  :global(:focus-visible) {
    outline: 0px;
  }
</style>