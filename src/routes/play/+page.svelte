<script lang="ts">
  import SceneList from './SceneList.svelte'
  import { Button } from 'flowbite-svelte'
  import { charSetting, chatRoles, sendChat, startStory, userSetting } from '$lib/api'
  import Input from './Input.svelte'
  import { onMount, tick } from 'svelte'
  import { story, initialScenes, additionalScenes, usage, storyPath, sessionPath, zeroUsage, firstSceneIndex, summarySceneIndex, replaceDict, char, user } from '$lib/store'
  import { savePath } from '$lib/fs'
  import { newSceneId, scrollToEnd } from '$lib'
  import DropSelect from '../common/DropSelect.svelte'
  import { Api, type Char, type SceneType } from '$lib/interfaces'

  let role = 'user'
  let userInput = ''

  function findFirstSceneIndex(scenes: SceneType[]) {
    const index = scenes.findIndex((scene) => (scene.role === startStory))
    return index < 0 ? scenes.length : index + 1
  }

  // Basically, we're returning newScenes. But trying to preserve images in oldScenes.
  function mergeScenes(oldScenes: SceneType[], oldFirstSceneIndex: number, newScenes: SceneType[], newFirstSceneIndex: number) {
    if (newScenes.length != oldScenes.length || oldFirstSceneIndex != newFirstSceneIndex) {
      // big change, refresh all images
      return newScenes
    }
    let scenes = []
    for (let i = 0; i < newScenes.length; i++) {
      let scene = newScenes[i]
      if (i >= newFirstSceneIndex) {
        scene.image = oldScenes[i].image
      }
      scenes.push(scene)
    }
    return scenes
  }

  function replaceCharSetting(replKey: string, char: Char, openTag: string, closeTag: string) {
    $replaceDict[replKey] = char.name
    $replaceDict[replKey + '_gender'] = char.gender
    return `${openTag}\nName: ${char.name}\nGender: ${char.gender}\nVisual: ${char.visual}\nDescription: ${char.description}\n${closeTag}`
  }

  function findNames(prompts: SceneType[]) {
    return prompts.map((prompt) => {
      let role = prompt.role
      let content = prompt.content
      if (prompt.role === charSetting) {
        content = replaceCharSetting('char', $char, '<Character>', '</Character>')
        role = 'system'
      } else if (prompt.role === userSetting) {
        content = replaceCharSetting('user', $user, '<Me <user>>', '</Me <user>>')
        role = 'system'
      }
      return { id: prompt.id, role: role, content: content, image: prompt.image }
    })
  }

  function replaceNames(prompts: SceneType[]) {
    return prompts.map((prompt) => {
      let content = prompt.content
      for (const [key, value] of Object.entries($replaceDict)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        content = content.replace(regex, value)
        const regex2 = new RegExp(`<${key}>`, 'g')
        content = content.replace(regex2, value)
      }
      return { id: prompt.id, role: prompt.role, content: content, image: prompt.image }
    })
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    const sec = date.getSeconds().toString().padStart(2, '0')

    return `${year}-${month}-${day}_${hour}-${min}-${sec}`
  }

  function insertTimestamp(filename: string): string {
    let extensionIndex = filename.lastIndexOf(".json")
    if (extensionIndex === -1) {
      extensionIndex = filename.length
    }

    const baseName = filename.slice(0, extensionIndex)
    const extension = filename.slice(extensionIndex)
    const timestamp = formatDate(new Date())

    return `${baseName}_${timestamp}${extension}`
  }

  async function save() {
    const tempPath = await savePath(insertTimestamp($storyPath), 'session', $additionalScenes)
    if (tempPath) {
      $sessionPath = tempPath
    }
  }

  function updateInitialScenes() {
    $firstSceneIndex = findFirstSceneIndex($story.prompts)
    $initialScenes = mergeScenes($initialScenes, $firstSceneIndex, $story.prompts, $firstSceneIndex)
    $initialScenes = findNames($initialScenes)
    $initialScenes = replaceNames($initialScenes)
  }

  function newSession() {
    updateInitialScenes()
    $additionalScenes = []
    $usage = zeroUsage
    $sessionPath = ''
    userInput = ''
    $summarySceneIndex = 0
  }

  async function regenerate() {
    if ($additionalScenes.length == 0) {
      return
    }
    $additionalScenes.pop()
    const scene = $additionalScenes.pop()
    if (scene) {
      const userNameLabel = $replaceDict['user'] + ": "
      userInput = scene.content.startsWith(userNameLabel) ? scene.content.slice(userNameLabel.length) : scene.content
    }
    $additionalScenes = $additionalScenes
  }

  async function summarize() {
    let newScene
    [newScene, $usage] = await sendChat($story, $initialScenes, $additionalScenes, true, $firstSceneIndex, $summarySceneIndex)
    if (newScene) {
      newScene.id = newSceneId($initialScenes, $additionalScenes)
      $summarySceneIndex = $additionalScenes.length
      $additionalScenes = [...$additionalScenes, newScene]
      await tick()
      scrollToEnd()
    }
  }

  onMount(() => {
    if ($additionalScenes.length == 0) {
      newSession()
    } else {
      updateInitialScenes()
    }
  })

  let warningTokens: boolean

  $: if ($story.api === Api.OpenAi) {
    warningTokens = $usage.total_tokens + $story.openAi.maxTokens > $story.openAi.contextSize 
  } else {
    warningTokens = $usage.total_tokens + $story.oobabooga.maxTokens > $story.oobabooga.contextSize 
  }
</script>

<main>
  <SceneList />
  <div class='grid grid-cols-[8rem,1fr] gap-2 mt-2'>
    <div class='col-span-2 text-sm text-stone-400'>
      Prompt tokens: {$usage.prompt_tokens}, Completion tokens: {$usage.completion_tokens}, Total tokens: {$usage.total_tokens}
    </div>
    {#if warningTokens}
      <div class='col-span-2 text-sm text-red-400'>
        Since the number of tokens can overflow the context size, you may want to summarize them.
      </div>
    {/if}
    <div class='col-span-2 text-sm text-stone-400'>
      <Button color='alternative' size='sm' on:click={newSession}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span class='pl-2'>New session</span>
      </Button>
      {#if $sessionPath}
        Saved {$sessionPath}
      {:else}
        <Button color='alternative' size='sm' on:click={save}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <span class='pl-2'>Save as ...</span>
        </Button>
      {/if}
      <Button color='alternative' size='sm' on:click={regenerate}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
        <span class='pl-2'>Back</span>
      </Button>
      <Button color='alternative' size='sm' on:click={summarize}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
        </svg>
        <span class='pl-2'>Summarize</span>
      </Button>
    </div>
    <div class='w-32 flex'>
      <DropSelect items={chatRoles} size="sm" classStr='text-sm self-start text-center w-full' bind:value={role} />
    </div>
    <div>
      <Input {role} bind:value={userInput} />
    </div>
  </div>
</main>
