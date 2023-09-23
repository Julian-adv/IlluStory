<script lang="ts">
  import SceneList from './SceneList.svelte'
  import { Button } from 'flowbite-svelte'
  import { firstScene, sendChat, userRole } from '$lib/api'
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
    chars,
    user,
    presetPath,
    curScene,
    curScenePath,
    charPaths,
    userPath,
    emptyCard,
    settings,
    session,
    replaceDict
  } from '$lib/store'
  import { basenameOf, charExt, presetExt, savePath, sceneExt, sessionExt } from '$lib/fs'
  import { lastScene, newSceneId, scrollToEnd } from '$lib'
  import { Api, type SceneType, type StoryCard, type StringDictionary } from '$lib/interfaces'
  import {
    loadSession,
    loadSessionDialog,
    makeReplaceDict,
    replaceChar,
    saveSessionAuto
  } from '$lib/session'
  import CardList from '../common/CardList.svelte'
  import CommonCard from '../common/CommonCard.svelte'
  import { loadChar } from '$lib/charSettings'
  import { cardFromPath, loadCardDialog } from '$lib/card'
  import { loadPreset } from '$lib/preset'
  import { loadScene } from '$lib/scene'
  import { presetCard, userCard, charCards, sceneCard, curChar, curCharPath } from '$lib/store'
  import { loadSettings } from '$lib/settings'
  import { BaseDirectory, createDir, readDir, exists } from '@tauri-apps/api/fs'
  import { appDataDir, sep } from '@tauri-apps/api/path'
  import { metadata } from 'tauri-plugin-fs-extra-api'
  import { extractImagePrompt } from '$lib/image'
  import { goto } from '$app/navigation'
  import DropSelect from '../common/DropSelect.svelte'

  let userInput = ''
  let started = false

  interface ScenePairs {
    prologues: SceneType[]
    dialogues: SceneType[]
  }

  function splitPreset(scenes: SceneType[]): ScenePairs {
    const index = scenes.findIndex(scene => scene.role === firstScene)
    if (index < 0) {
      return { prologues: scenes, dialogues: $curScene.scenes }
    } else {
      const copy = structuredClone(scenes)
      copy.splice(index, 1)
      if ($curScene.scenes.length > 0) {
        return { prologues: copy, dialogues: structuredClone($curScene.scenes) }
      } else {
        return { prologues: copy, dialogues: structuredClone(scenes.slice(index, index + 1)) }
      }
    }
  }

  async function convertScenes(newScenes: SceneType[], dict: StringDictionary) {
    let scenes = []
    for (let i = 0; i < newScenes.length; i++) {
      let scene = newScenes[i]
      scene = await extractImagePrompt($settings, newScenes[i], dict)
      scenes.push(scene)
    }
    return scenes
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

  function relativePath(dataDir: string, path: string) {
    return path.replace(dataDir, '')
  }

  const sessionsDir = 'sessions'

  async function saveSession() {
    if (!(await exists(sessionsDir, { dir: BaseDirectory.AppData }))) {
      createDir(sessionsDir, {
        dir: BaseDirectory.AppData,
        recursive: true
      })
    }
    const dataDir = await appDataDir()
    const sessionsPath = dataDir + sessionsDir
    const tempPath = sessionsPath + sep + 'session-' + formatDate(new Date()) + '.' + sessionExt
    $session.presetCard = relativePath(dataDir, $presetCard.path)
    $session.userCard = relativePath(dataDir, $userCard.path)
    $session.charCards = $charCards.map(card => relativePath(dataDir, card.path))
    $session.sceneCard = relativePath(dataDir, $sceneCard.path)
    saveSessionAuto(tempPath, $session, $dialogues)
    $sessionPath = tempPath
  }

  async function findMostRecentSession() {
    let mostRecent = { path: '', modified: new Date(0) }
    const entries = await readDir(sessionsDir, { dir: BaseDirectory.AppData, recursive: true })
    for (const entry of entries) {
      if (entry.name && entry.name.endsWith(sessionExt)) {
        const stat = await metadata(entry.path)
        if (stat.modifiedAt > mostRecent.modified) {
          mostRecent = { path: entry.path, modified: stat.modifiedAt }
        }
      }
    }
    return mostRecent.path
  }

  let shortSessionPath = ''

  async function loadRecentSession() {
    const dataDir = await appDataDir()
    const mostRecentPath = await findMostRecentSession()
    if (mostRecentPath) {
      let _dialogues
      $session = await loadSession(mostRecentPath)
      $sessionPath = mostRecentPath
      shortSessionPath = basenameOf(mostRecentPath)
      $presetCard = await cardFromPath(dataDir + $session.presetCard)
      $userCard = await cardFromPath(dataDir + $session.userCard)
      $charCards = await Promise.all($session.charCards.map(path => cardFromPath(dataDir + path)))
      $sceneCard = await cardFromPath(dataDir + $session.sceneCard)
      await startWithoutSave()
      const result = splitPreset($preset.prompts)
      $prologues = replaceChar(result.prologues, $chars[$session.lastSpeaker], $user)
      $replaceDict = makeReplaceDict($chars[$session.lastSpeaker], $user)
      $dialogues = await convertScenes($session.scenes, $replaceDict)
    }
  }

  async function load() {
    const [session, path] = await loadSessionDialog()
    if (session) {
      $dialogues = session.scenes
      $sessionPath = path
    }
  }

  async function updateInitialScenes() {
    const result = splitPreset($preset.prompts)
    $prologues = replaceChar(result.prologues, $chars[$session.lastSpeaker], $user)
    $replaceDict = makeReplaceDict($chars[$session.lastSpeaker], $user)
    $dialogues = await convertScenes(result.dialogues, $replaceDict)
  }

  async function newSession() {
    $presetCard = emptyCard
    $userCard = emptyCard
    $charCards = [emptyCard]
    $sceneCard = emptyCard
    $dialogues = []
    $sessionPath = ''
    started = false
    shortSessionPath = ''
  }

  async function goBack() {
    while ($dialogues.length > 1) {
      const lastS = lastScene($dialogues)
      if (lastS.role === userRole) {
        const scene = $dialogues.pop()
        if (scene) {
          const userNameLabel = $user.name + ': '
          userInput = scene.content.startsWith(userNameLabel)
            ? scene.content.slice(userNameLabel.length)
            : scene.content
        }
        break
      } else {
        $dialogues.pop()
      }
    }
    $dialogues = $dialogues
  }

  async function summarize() {
    const result = await sendChat($preset, $prologues, $dialogues, true, $summarySceneIndex)
    if (result) {
      $usage = result.usage
      result.addedScene.id = newSceneId($dialogues)
      $summarySceneIndex = $dialogues.length
      $dialogues = [...$dialogues, result.addedScene]
      await tick()
      scrollToEnd()
    }
  }

  onMount(async () => {
    await loadSettings()
    if ($dialogues.length === 0) {
      await loadRecentSession()
    } else {
      started = true
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

  async function startWithoutSave() {
    $preset = await loadPreset($presetCard.path)
    $presetPath = $presetCard.path
    $user = await loadChar($userCard.path)
    $userPath = $userCard.path
    $chars = await Promise.all($charCards.map(card => loadChar(card.path)))
    $charPaths = $charCards.map(card => card.path)
    $curScene = await loadScene($sceneCard.path)
    $curScenePath = $sceneCard.path
    started = true
  }

  async function start() {
    await startWithoutSave()
    await updateInitialScenes()
    $usage = zeroUsage
    $sessionPath = ''
    userInput = ''
    $summarySceneIndex = 0
    $session.lastSpeaker = 0
    await saveSession()
  }

  function onRemove(index: number) {
    $charCards.splice(index, 1)
    $charCards = $charCards
  }

  async function onClickPresetCard(card: StoryCard) {
    if (card.path) {
      const tempPreset = await loadPreset(card.path)
      if (tempPreset) {
        $preset = tempPreset
        $presetPath = card.path
      }
    }
    goto('/write')
  }

  async function onClickCharCard(card: StoryCard) {
    if (card.path) {
      const tempChar = await loadChar(card.path)
      if (tempChar) {
        $curCharPath = card.path
        $curChar = tempChar
      }
    }
    goto('/write_char')
  }

  async function onClickSceneCard(card: StoryCard) {
    if (card.path) {
      const tempScene = await loadScene(card.path)
      if (tempScene) {
        $curScenePath = card.path
        $curScene = tempScene
      }
    }
    goto('/write_scene')
  }

  const chatOrders = [
    { value: 'random', name: 'Random' },
    { value: 'round_robin', name: 'Round robin' }
  ]
  let chatOrder = 'random'
</script>

<main>
  <h1 class="text-lg font-semibold mb-1 mt-3 px-4">
    Session <span class="text-stone-400 text-sm">{shortSessionPath}</span>
  </h1>
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
  <div class="p-4 grid grid-cols-[9rem,16rem,9rem,16rem] gap-4 items-center">
    <div class="text-right">Preset</div>
    <div class="flex flex-wrap flex-none gap-2 items-end">
      <CommonCard card={$presetCard} onClick={onClickPresetCard} />

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
    <div class="text-right">User</div>
    <div class="flex flex-wrap flex-none gap-2 items-end">
      <CommonCard card={$userCard} onClick={onClickCharCard} />

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
    <div class="text-right">Characters</div>
    <div class="flex flex-wrap flex-none gap-2 col-span-3 items-end">
      <CardList cards={$charCards} {onRemove} onClick={onClickCharCard} />

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
    <div class="text-right">Scene</div>
    <div class="flex flex-wrap flex-none gap-2 col-span-3 items-end">
      <CommonCard card={$sceneCard} onClick={onClickSceneCard} />

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
      <div class="col-span-3 text-sm text-stone-400 flex gap-2 items-center">
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
        <span>Chat order:</span>
        <DropSelect
          items={chatOrders}
          size="sm"
          classStr="text-sm self-start text-center"
          bind:value={chatOrder} />
      </div>
      <Input bind:value={userInput} {chatOrder} />
    </div>
  {/if}
</main>
