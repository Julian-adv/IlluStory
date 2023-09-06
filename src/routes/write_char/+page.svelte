<script lang="ts">
  import { loadCharDialog, loadMetaDataDialog, saveChar } from '$lib/charSettings'
  import { saveObjQuietly } from '$lib/fs'
  import { Button, Checkbox, Label } from 'flowbite-svelte'
  import StringField from '../common/StringField.svelte'
  import ImageField from '../common/ImageField.svelte'
  import SelectField from '../common/SelectField.svelte'
  import TextField from '../common/TextField.svelte'
  import { countTokensApi } from '$lib/api'
  import { curChar, curCharPath, settings } from '$lib/store'
  import { generateImage } from '$lib/imageApi'
  import { onMount } from 'svelte'

  let autoSave = true
  let totalTokens = 0
  const genders = [
    { name: 'Male', value: 'male' },
    { name: 'Female', value: 'female' },
    { name: 'Neuter', value: 'neuter' }
  ]

  async function load() {
    const [tempChar, tempFilePath] = await loadCharDialog()
    if (tempChar) {
      $curChar = tempChar
      $curCharPath = tempFilePath
      totalTokens = 0
    }
  }

  function decodeBase64(base64: string) {
    const text = atob(base64)
    const length = text.length
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = text.charCodeAt(i)
    }
    const decoder = new TextDecoder() // default is utf-8
    return decoder.decode(bytes)
  }

  async function importChar() {
    const metadata = await loadMetaDataDialog()
    if (metadata) {
      const charStr = decodeBase64(metadata.tEXt.chara)
      const char = JSON.parse(charStr)
      if (char.spec === 'chara_card_v2') {
        $curChar.name = char.data.name
        $curChar.description =
          char.data.description +
          '\nPersonality: ' +
          char.data.personality +
          '\nScenario: ' +
          char.data.scenario +
          '\nFirst message: ' +
          char.data.first_mes +
          '\nMessage example: ' +
          char.data.mes_example +
          '\nCreator notes: ' +
          char.data.creator_notes +
          '\nSystem prompt: ' +
          char.data.system_prompt +
          '\nPost history instructions: ' +
          char.data.post_history_instructions +
          '\nAlternate greetings: ' +
          char.data.alternate_greetings +
          // '\nCharacter book: ' +
          // JSON.stringify(char.data.character_book, null, 2) +
          '\nTags: ' +
          char.data.tags +
          '\nCreator: ' +
          char.data.creator +
          '\nCharacter version: ' +
          char.data.character_version
        // + '\nExtensions: ' +
        // JSON.stringify(char.data.extensions, null, 2)
      }
    }
  }

  async function save() {
    const tempFilePath = await saveChar($curChar)
    if (tempFilePath) {
      $curCharPath = tempFilePath
      totalTokens = 0
    }
  }

  async function autoSaveFunc() {
    if (autoSave && $curCharPath !== '') {
      saveObjQuietly($curCharPath, $curChar)
      totalTokens = 0
    }
  }

  function countTokens(str: string) {
    if (str) {
      const tokens = countTokensApi(str)
      totalTokens += tokens
      return tokens
    }
    return 0
  }

  async function regenerateImage() {
    $curChar.image = await generateImage($settings, 512, 768, $curChar.visual)
  }

  onMount(() => {
    totalTokens = 0
  })
</script>

<h1 class="text-lg font-semibold mb-1">Character Editing</h1>
<div class="mt-2 mb-5 flex gap-2">
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
  <Button color="alternative" size="sm" on:click={importChar}>
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
    <span class="pl-2">Import</span>
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
  <Checkbox class="inline self-center" bind:checked={autoSave}>Auto save</Checkbox>
</div>
<div class="grid grid-cols-[9rem,5rem,1fr] gap-0">
  <StringField label="File path" size="sm" bind:value={$curCharPath} disabled />
  <ImageField
    label="Image"
    bind:value={$curChar.image}
    width={512}
    height={768}
    save={autoSaveFunc} />
  <Button
    color="alternative"
    class="col-start-2 col-span-2 w-10 h-10 p-0 bg-stone-100 z-20 text-stone-200 border-stone-100 focus:ring-0"
    pill
    on:click={regenerateImage}>
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
        d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
    </svg>
  </Button>
  <StringField label="Name" bind:value={$curChar.name} save={autoSaveFunc} />
  <SelectField
    label="Gender"
    items={genders}
    search={false}
    bind:value={$curChar.gender}
    save={autoSaveFunc} />
  <TextField label="Visual" bind:value={$curChar.visual} save={autoSaveFunc} />
  <span class="text-sm text-stone-400 px-2 col-start-2 col-span-2 mb-2"
    >Tokens: {countTokens($curChar.visual)}</span>
  <TextField label="Description" bind:value={$curChar.description} save={autoSaveFunc} />
  <span class="text-sm text-stone-400 px-2 col-start-2 col-span-2 mb-2"
    >Tokens: {countTokens($curChar.description)}</span>
  <Label for="totalTokens" class="text-base self-center text-right w-full">Total tokens</Label>
  <div id="totalTokens" class="text-base p-3 col-start-2 col-span-2">{totalTokens}</div>
</div>
