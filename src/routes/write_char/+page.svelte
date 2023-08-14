<script lang="ts">
  import { loadCharDialog, type Char, saveChar } from "$lib/charSettings"
  import { saveObjQuietly } from "$lib/fs"
  import { Button, Checkbox, Label } from "flowbite-svelte"
  import StringField from "../common/StringField.svelte"
  import ImageField from "../common/ImageField.svelte"
  import SelectField from "../common/SelectField.svelte"
  import TextField from "../common/TextField.svelte"
  import { countTokensApi } from "$lib/api"

  let autoSave = true
  let char: Char = {
    image: '',
    name: '',
    gender: '',
    visual: '',
    description: ''
  }
  let charPath = ''
  let totalTokens = 0
  const genders = [
    { name: 'Male', value: 'male' },
    { name: 'Female', value: 'female' },
    { name: 'Neuter', value: 'neuter' },
  ]

  async function load() {
    const [tempChar, tempFilePath] = await loadCharDialog()
    if (tempChar) {
      char = tempChar
      charPath = tempFilePath
      totalTokens = 0
      console.log('load', char.gender)
    }
  }

  async function save() {
    const tempFilePath = await saveChar(char)
    if (tempFilePath) {
      charPath = tempFilePath
      totalTokens = 0
    }
  }

  async function autoSaveFunc() {
    if (autoSave && charPath !== '') {
      saveObjQuietly(charPath, char)
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
</script>

<h1 class='text-lg font-semibold mb-1'>Character Editing</h1>
<div class='mt-2 mb-5 flex gap-2'>
  <Button color='alternative' size='sm' on:click={load}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
    </svg>
    Load
  </Button>
  <Button color='alternative' size='sm' on:click={save}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
    Save as ...
  </Button>
  <Checkbox class='inline self-center' bind:checked={autoSave}>Auto save</Checkbox>
</div>
<div class='grid grid-cols-[9rem,5rem,1fr] gap-0'>
  <StringField label='File path' size='sm' bind:value={charPath} disabled />
  <ImageField label='Image' bind:value={char.image} save={autoSaveFunc} />
  <StringField label='Name' bind:value={char.name} save={autoSaveFunc} />
  <SelectField label='Gender' items={genders} search={false} bind:value={char.gender} save={autoSaveFunc} />
  <TextField label='Visual' bind:value={char.visual} save={autoSaveFunc} />
  <span class='text-sm text-stone-400 px-2 col-start-2 col-span-2 mb-2'>Tokens: {countTokens(char.visual)}</span>
  <TextField label='Description' bind:value={char.description} save={autoSaveFunc} />
  <span class='text-sm text-stone-400 px-2 col-start-2 col-span-2 mb-2'>Tokens: {countTokens(char.description)}</span>
  <Label for='totalTokens' class='text-base self-center text-right w-full'>Total tokens</Label>
  <div id='totalTokens' class='text-base p-3 col-start-2 col-span-2'>{totalTokens}</div>
</div>
