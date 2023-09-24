<script lang="ts">
  import Markdown from '../common/Markdown.svelte'
  import DropSelect from '../common/DropSelect.svelte'
  import { chatRoles, sendChat, waitingResponse } from '$lib/api'
  import {
    sessionPath,
    preset,
    prologues,
    dialogues,
    usage,
    summarySceneIndex,
    settings,
    session,
    chars,
    user,
    replaceDict
  } from '$lib/store'
  import { lastScene, newSceneId, scrollToEnd, translateButtonClass } from '$lib'
  import { onMount, tick } from 'svelte'
  import { Button } from 'flowbite-svelte'
  import { translateText } from '$lib/deepLApi'
  import { getNextHistory, getPrevHistory, pushHistory } from '$lib/history'
  import { makeReplaceDict, replaceChar, replaceNames, saveSessionAuto } from '$lib/session'
  import { extractImagePrompt } from '$lib/image'

  export let role = 'user'
  export let value = ''
  export let nextChar = 'random'
  const enterPrompt = 'Write a prompt.'
  let placeholder = enterPrompt

  type State = 'start' | 'modified' | 'translated' | 'unmodified'

  interface ValueState {
    state: State
    value: string
    translated: string
    entered: string
  }

  type Transition = {
    [key in State]: () => Promise<ValueState> | ValueState
  }

  let state: ValueState = {
    state: 'start',
    value: value,
    translated: '',
    entered: ''
  }

  let currentIndex = 0

  function saveSession() {
    if ($sessionPath !== '') {
      saveSessionAuto($sessionPath, $session, $dialogues)
    }
  }

  function _received(text: string) {
    $dialogues[$dialogues.length - 1].content += text
    $dialogues[$dialogues.length - 1].done = false
  }

  function _closedCb() {
    $dialogues[$dialogues.length - 1].done = true
  }

  async function sendInput(content: string) {
    if (content[0] === '"') {
      content = `${$user.name}: ` + content
    }
    const sceneId = newSceneId($dialogues)
    const userScene = {
      id: sceneId,
      role: role,
      content: content,
      textContent: content,
      done: false
    }
    const waitingScene = {
      id: sceneId + 1,
      role: waitingResponse,
      content: '',
      textContent: '',
      done: false
    }
    $dialogues = [...$dialogues, userScene, waitingScene]
    await tick()
    scrollToEnd()
    if (nextChar === 'random') {
      $session.nextSpeaker = Math.floor(Math.random() * $chars.length)
    } else {
      $session.nextSpeaker = $chars.findIndex(char => char.name === nextChar)
    }
    // let prologs = replaceChars($prologues, $chars, $user)
    let prologs = replaceChar($prologues, $chars[$session.nextSpeaker], $user)
    $replaceDict = makeReplaceDict($chars[$session.nextSpeaker], $user)
    prologs = replaceNames(prologs, $replaceDict)
    const result = await sendChat($preset, prologs, $dialogues, false, $summarySceneIndex)
    if (result) {
      $usage = result.usage
      let scene = lastScene($dialogues)
      scene.role = result.scene.role
      scene.content = result.scene.content
      scene = await extractImagePrompt($settings, scene, $replaceDict)
      $dialogues = $dialogues
      await tick()
      scrollToEnd()
      if (nextChar !== 'random') {
        $session.nextSpeaker++
        if ($session.nextSpeaker >= $chars.length) {
          $session.nextSpeaker = 0
        }
        nextChar = $chars[$session.nextSpeaker].name
      }
    }
    saveSession()
  }

  async function nextState(state: ValueState, transition: Transition): Promise<ValueState> {
    const func = transition[state.state]
    if (!func) {
      throw new Error(`No transition function defined for state: ${state.state}`)
    }
    return await func()
  }

  async function onEnter(markdown: string) {
    state = await nextState(state, {
      start: () => {
        return { state: 'start', value: '', translated: '', entered: '' }
      },
      modified: async () => {
        const trimmed = markdown.trim()
        pushHistory($settings, trimmed)
        currentIndex = history.length
        if ($settings.translateInput) {
          const translated = await translateText($settings, $settings.aiLang, trimmed)
          return {
            state: 'translated',
            value: translated,
            translated: translated,
            entered: trimmed
          }
        } else {
          sendInput(state.entered)
          return { state: 'start', value: '', translated: '', entered: '' }
        }
      },
      translated: () => {
        sendInput(state.translated)
        return { state: 'start', value: '', translated: '', entered: '' }
      },
      unmodified: () => {
        return { ...state, state: 'translated', value: state.translated }
      }
    })
  }

  async function onModify(str: string) {
    state = await nextState(state, {
      start: () => {
        return { state: 'modified', value: str, translated: '', entered: str }
      },
      modified: () => {
        return { ...state, value: str, entered: str }
      },
      translated: () => {
        return { ...state, value: str, translated: str }
      },
      unmodified: () => {
        return { state: 'modified', value: str, translated: '', entered: str }
      }
    })
  }

  async function onArrowUp() {
    ;[state.value, currentIndex] = getPrevHistory($settings, currentIndex)
    state.state = 'modified'
    state.entered = state.value
    state.translated = ''
  }

  async function onArrowDown() {
    ;[state.value, currentIndex] = getNextHistory($settings, currentIndex)
    state.state = 'modified'
    state.entered = state.value
    state.translated = ''
  }

  async function translate() {
    state = await nextState(state, {
      start: () => {
        return state
      },
      modified: async () => {
        const translated = await translateText($settings, $settings.aiLang, state.value)
        return {
          state: 'translated',
          value: translated,
          translated: translated,
          entered: state.value
        }
      },
      translated: () => {
        return { ...state, state: 'unmodified', value: state.entered }
      },
      unmodified: () => {
        return { ...state, state: 'translated', value: state.translated }
      }
    })
  }

  onMount(() => {
    currentIndex = $settings.history.length
  })

  $: transButtonClass = `px-[0.5rem] ${translateButtonClass(state.state === 'translated')}`
  $: {
    if (value) {
      state.state = 'translated'
      state.value = value
      state.entered = value
      state.translated = value
      value = ''
    }
  }
</script>

<div class="w-32 flex">
  <DropSelect
    items={chatRoles}
    size="sm"
    classStr="text-sm self-start text-center w-full"
    bind:value={role} />
</div>
<div>
  <Markdown
    bind:value={state.value}
    readOnly={false}
    {placeholder}
    {onEnter}
    {onArrowUp}
    {onArrowDown}
    {onModify} />
</div>
<div>
  <Button color="alternative" size="sm" class={transButtonClass} on:click={translate}>
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
        d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
    </svg>
  </Button>
</div>
<div></div>
