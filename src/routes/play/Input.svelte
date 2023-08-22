<script lang="ts">
  import Markdown from "../common/Markdown.svelte"
  import DropSelect from "../common/DropSelect.svelte"
  import { chatRoles, sendChat } from "$lib/api"
  import { sessionPath, story, initialScenes, additionalScenes, usage, firstSceneIndex, summarySceneIndex, replaceDict, settings } from "$lib/store"
  import { writeTextFile } from "@tauri-apps/api/fs"
  import { newSceneId, scrollToEnd } from "$lib"
  import { onMount, tick } from "svelte"
  import { Button } from "flowbite-svelte"
  import { translateText } from "$lib/deepLApi"
  import { getNextHistory, getPrevHistory, pushHistory } from "$lib/history"

  export let role = 'user'
  export let value = ''
  export let translatedInput = ''
  const enterPrompt = 'Write a prompt.'
  let placeholder = enterPrompt

  let currentIndex = 0

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

  async function sendInput(content: string) {
    const newScene = {
      id: newSceneId($initialScenes, $additionalScenes),
      role: role,
      content: content,
      done: false
    }
    $additionalScenes = [...$additionalScenes, newScene]
    await tick()
    scrollToEnd()
    let addedScene;
    [addedScene, $usage] = await sendChat($story, $initialScenes, $additionalScenes, false, $firstSceneIndex, $summarySceneIndex)
    if (addedScene) {
      addedScene.id = newSceneId($initialScenes, $additionalScenes)
      $additionalScenes = [...$additionalScenes, addedScene]
      await tick()
      scrollToEnd()
    }
    saveScenes()
  }

  async function onEnter(markdown: string) {
    if ($settings.translateInput && markdown === '' && translatedInput) {
      sendInput(translatedInput)
      translatedInput = ''
      placeholder = enterPrompt
    } else {
      const trimmed = markdown.trim()
      let content
      if (trimmed[0] === '"') {
        content = `${$replaceDict['user']}: ` + trimmed 
      } else {
        content = trimmed
      }
      pushHistory($settings, trimmed)
      currentIndex = history.length
      value = ''
      if ($settings.translateInput) {
        translatedInput = await translateText($settings, $settings.aiLang, content)
        placeholder = 'Enter one more time to send. Up arrow to modify.'
      } else {
        sendInput(content)
      }
    }
  }

  async function onArrowUp() {
    [value, currentIndex] = getPrevHistory($settings, currentIndex)
  }

  async function onArrowDown() {
    [value, currentIndex] = getNextHistory($settings, currentIndex)
  }

  async function translate() {
    if (translatedInput) {
      translatedInput = ''
    } else {
      translatedInput = await translateText($settings, $settings.aiLang, value)
    }
  }

  onMount(() => {
    currentIndex = $settings.history.length
  })
</script>

<div></div>
<div>
  {translatedInput}
</div>
<div></div>
<div class='w-32 flex'>
  <DropSelect items={chatRoles} size="sm" classStr='text-sm self-start text-center w-full' bind:value={role} />
</div>
<div>
  <Markdown bind:value={value} readOnly={false} {placeholder} {onEnter} {onArrowUp} {onArrowDown} />
</div>
<div>
  <Button color='alternative' size='sm' class='px-[0.5rem]' on:click={translate}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
    </svg>
  </Button>
</div>
<div></div>