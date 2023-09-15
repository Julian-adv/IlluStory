<script lang="ts">
  import SceneList from './SceneList.svelte'
  import { Button } from 'flowbite-svelte'
  import { charSetting, firstScene, sendChat, userRole, userSetting } from '$lib/api'
  import Input from './Input.svelte'
  import { onMount, tick } from 'svelte'
  import {
    preset,
    prologues,
    dialogues,
    usage,
    sessionPath,
    zeroUsage,
    summarySceneIndex,
    replaceDict,
    char,
    user,
    presetPath,
    curScene,
    curScenePath,
    charPath,
    userPath,
    emptyCard
  } from '$lib/store'
  import { basenameOf, charExt, presetExt, savePath, sceneExt, sessionExt } from '$lib/fs'
  import { lastScene, newSceneId, scrollToEnd } from '$lib'
  import { Api, type Char, type SceneType } from '$lib/interfaces'
  import { loadSessionDialog } from '$lib/session'
  import CardList from '../common/CardList.svelte'
  import CommonCard from '../common/CommonCard.svelte'
  import { loadChar } from '$lib/charSettings'
  import { loadCardDialog } from '$lib/card'
  import { loadPreset } from '$lib/preset'
  import { loadScene } from '$lib/scene'
  import { presetCard, userCard, charCards, sceneCard } from '$lib/store'

  let userInput = ''
  let started = false

  function splitPreset(scenes: SceneType[]): [SceneType[], SceneType[]] {
    const index = scenes.findIndex(scene => scene.role === firstScene)
    if (index < 0) {
      return [scenes, $curScene.scenes]
    } else {
      const copy = [...scenes]
      copy.splice(index, 1)
      if ($curScene.scenes.length > 0) {
        return [copy, $curScene.scenes]
      } else {
        return [copy, scenes.slice(index, index + 1)]
      }
    }
  }

  // Basically, we're returning newScenes. But trying to preserve images in oldScenes.
  async function mergeScenes(oldScenes: SceneType[], newScenes: SceneType[]) {
    return newScenes
    // if (newScenes.length != oldScenes.length) {
    //   // big change, refresh all images
    //   return newScenes
    // }
    // let scenes = []
    // for (let i = 0; i < newScenes.length; i++) {
    //   let scene = newScenes[i]
    //   if (oldScenes[i].content) {
    //     scene = oldScenes[i]
    //   } else {
    //     scene = await extractImagePrompt($settings, newScenes[i])
    //   }
    //   scenes.push(scene)
    // }
    // return scenes
  }

  function replaceCharSetting(replKey: string, char: Char) {
    $replaceDict[replKey] = char.name
    $replaceDict[replKey + '_gender'] = char.gender
    return `Name: ${char.name}\nGender: ${char.gender}\nVisual: ${char.visual}\nDescription: ${char.description}\n`
  }

  function findNames(prompts: SceneType[]) {
    return prompts.map(prompt => {
      let content = prompt.content
      if (prompt.role === charSetting) {
        content = replaceCharSetting('char', $char)
      } else if (prompt.role === userSetting) {
        content = replaceCharSetting('user', $user)
      }
      return { ...prompt, content }
    })
  }

  function replaceNames(prompts: SceneType[]) {
    return prompts.map(prompt => {
      let content = prompt.content
      for (const [key, value] of Object.entries($replaceDict)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        if (content) {
          content = content.replace(regex, value)
          const regex2 = new RegExp(`<${key}>`, 'g')
          content = content.replace(regex2, value)
        }
      }
      return { ...prompt, content }
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
    const baseName = basenameOf(filename)
    const timestamp = formatDate(new Date())

    return `${baseName}_${timestamp}`
  }

  async function save() {
    const tempPath = await savePath(insertTimestamp($presetPath), sessionExt, $dialogues)
    if (tempPath) {
      $sessionPath = tempPath
    }
  }

  async function load() {
    const [session, path] = await loadSessionDialog()
    if (session) {
      $dialogues = session
      $sessionPath = path
    }
  }

  async function updateInitialScenes() {
    let newDialogues
    ;[$prologues, newDialogues] = splitPreset($preset.prompts)
    $dialogues = await mergeScenes($dialogues, newDialogues)
    $prologues = findNames($prologues)
    $prologues = replaceNames($prologues)
    $dialogues = replaceNames($dialogues)
  }

  async function newSession() {
    await updateInitialScenes()
    $usage = zeroUsage
    $sessionPath = ''
    userInput = ''
    $summarySceneIndex = 0
  }

  async function goBack() {
    if ($dialogues.length < 2) {
      return
    }
    // pop output of AI
    $dialogues.pop()
    if (lastScene($dialogues).role === userRole) {
      const scene = $dialogues.pop()
      if (scene) {
        const userNameLabel = $replaceDict['user'] + ': '
        userInput = scene.content.startsWith(userNameLabel)
          ? scene.content.slice(userNameLabel.length)
          : scene.content
      }
      $dialogues = $dialogues
    }
  }

  async function summarize() {
    let newScene
    ;[newScene, $usage] = await sendChat($preset, $prologues, $dialogues, true, $summarySceneIndex)
    if (newScene) {
      newScene.id = newSceneId($dialogues)
      $summarySceneIndex = $dialogues.length
      $dialogues = [...$dialogues, newScene]
      await tick()
      scrollToEnd()
    }
  }

  onMount(async () => {
    if ($prologues.length == 0) {
      await newSession()
    }
  })

  let warningTokens: boolean

  $: if ($preset.api === Api.OpenAi) {
    warningTokens = $usage.total_tokens + $preset.openAi.maxTokens > $preset.openAi.contextSize
  } else {
    warningTokens =
      $usage.total_tokens + $preset.oobabooga.maxTokens > $preset.oobabooga.contextSize
  }

  async function addPresetCard() {
    const card = await loadCardDialog([presetExt])
    if (card) {
      $presetCard = card
    }
  }

  async function addUserCard() {
    const card = await loadCardDialog([charExt])
    if (card) {
      $userCard = card
    }
  }

  async function addSceneCard() {
    const card = await loadCardDialog([sceneExt])
    if (card) {
      $sceneCard = card
    }
  }

  async function addCharCard() {
    const card = await loadCardDialog([charExt])
    if (card) {
      if ($charCards[0] === emptyCard) {
        $charCards = []
      }
      $charCards.push(card)
      $charCards = $charCards
    }
  }

  $: ready =
    $presetCard !== emptyCard &&
    $userCard !== emptyCard &&
    $sceneCard !== emptyCard &&
    $charCards.length > 0 &&
    $charCards[0] !== emptyCard

  async function start() {
    $preset = await loadPreset($presetCard.path)
    $presetPath = $presetCard.path
    $user = await loadChar($userCard.path)
    $userPath = $userCard.path
    $char = await loadChar($charCards[0].path)
    $charPath = $charCards[0].path
    $curScene = await loadScene($sceneCard.path)
    $curScenePath = $sceneCard.path
    newSession()
    started = true
  }
</script>

<main>
  <h1 class="text-lg font-semibold mb-1 mt-3 px-4">Session</h1>
  <div class="px-4">
    <Button color="alternative" size="sm" on:click={newSession}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
      <span class="pl-2">New session</span>
    </Button>
    <Button color="alternative" size="sm" on:click={load}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
      </svg>
      <span class="pl-2">Load</span>
    </Button>
    <Button color="alternative" size="sm" on:click={save}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <span class="pl-2">Save as ...</span>
    </Button>
  </div>
  <span class="text-xs text-stone-400">{$sessionPath}</span>
  <div class="p-4 grid grid-cols-[9rem,16rem,9rem,16rem] gap-4">
    <div class="text-right">Preset:</div>
    <div class="flex flex-wrap flex-none gap-2">
      <CommonCard card={$presetCard} />

      <Button size="xs" color="alternative" class="focus:ring-0 w-10 h-10" on:click={addPresetCard}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Button>
    </div>
    <div class="text-right">User:</div>
    <div class="flex flex-wrap flex-none gap-2">
      <CommonCard card={$userCard} />

      <Button size="xs" color="alternative" class="focus:ring-0 w-10 h-10" on:click={addUserCard}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Button>
    </div>
    <div class="text-right">Characters:</div>
    <div class="flex flex-wrap flex-none gap-2 col-span-3">
      <CardList cards={$charCards} />

      <Button size="xs" color="alternative" class="focus:ring-0 w-10 h-10" on:click={addCharCard}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Button>
    </div>
    <div class="text-right">Scene:</div>
    <div class="flex flex-wrap flex-none gap-2 col-span-3">
      <CommonCard card={$sceneCard} />

      <Button size="xs" color="alternative" class="focus:ring-0 w-10 h-10" on:click={addSceneCard}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Button>
    </div>
  </div>
  <div class="flex justify-center">
    <Button color="primary" size="lg" disabled={!ready} on:click={start}>Start</Button>
  </div>
  {#if started}
    <SceneList />
    <div class="grid grid-cols-[8rem,1fr,3rem] gap-2 mt-2 px-4">
      <div class="col-span-3 text-sm text-stone-400">
        Prompt tokens: {$usage.prompt_tokens}, Completion tokens: {$usage.completion_tokens}, Total
        tokens: {$usage.total_tokens}
      </div>
      {#if warningTokens}
        <div class="col-span-3 text-sm text-red-400">
          Since the number of tokens can overflow the context size, you may want to summarize them.
        </div>
      {/if}
      <div class="col-span-3 text-sm text-stone-400">
        <Button color="alternative" size="sm" on:click={goBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          <span class="pl-2">Back</span>
        </Button>
        <Button color="alternative" size="sm" on:click={summarize}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
          </svg>
          <span class="pl-2">Summarize</span>
        </Button>
      </div>
      <Input bind:value={userInput} />
    </div>
  {/if}
</main>
