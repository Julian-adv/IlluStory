<script lang="ts">
  import { Label, Input, Select, Textarea } from 'flowbite-svelte'
  import { writeTextFile, BaseDirectory, readTextFile } from '@tauri-apps/api/fs'
  import { onMount } from 'svelte';
  import { openAiApiKey, openAiModel } from '$lib/store';
  import { Configuration, OpenAIApi } from 'openai'

  const settingsFile = 'settings.json'
  let models = [
    { value: "model", name: "model" }
  ]
  let prompt = ''
  let roles = [
    { value: "system", name: "System" },
    { value: "assistant", name: "Assistant" },
    { value: "user", name: "User" },
  ]

  async function saveSettings() {
    const settings = {
      "openAiApiKey": $openAiApiKey,
      "openAiModel": $openAiModel
    }
    writeTextFile({ path: settingsFile, contents: JSON.stringify(settings) }, { dir: BaseDirectory.AppConfig })
  }

  onMount(async () => {
    const settingsJson = await readTextFile(settingsFile, { dir: BaseDirectory.AppConfig })
    const settings = JSON.parse(settingsJson)
    openAiApiKey.set(settings.openAiApiKey)
    openAiModel.set(settings.openAiModel)
    const configuration = new Configuration({
      apiKey: settings.openAiApiKey
    })
    const openai = new OpenAIApi(configuration)
    const response = await openai.listModels()
    console.log('response', response)
    models = response.data.data.map((model) => {
      return { value: model.id, name: model.id }
    })
  })
</script>

<h1 class='text-lg font-semibold mb-1'>Settings</h1>
<div class='grid grid-cols-[8rem,1fr] gap-2'>
  <div class='w-32 flex'>
    <Label for='openAIKey' class='text-base self-center text-right w-full'>Open AI API Key</Label>
  </div>
  <div class=''>
    <Input id='openAIKey' placeholder="sk-xxxxx" bind:value={$openAiApiKey} on:blur={saveSettings} />
  </div>
  <div class='w-32 flex'>
    <Label for='models' class='text-base self-center text-right w-full'>Model</Label>
  </div>
  <div class=''>
    <Select id='models' items={models} bind:value={$openAiModel} on:change={saveSettings} />
  </div>
</div>

<h1 class='text-lg font-semibold mb-1'>Prompts</h1>
<div class='grid grid-cols-[8rem,1fr] gap-2'>
  <div class='w-32 flex'>
    <Select items={roles} size="sm" class='text-base self-start text-center w-full' />
  </div>
  <div class=''>
    <Textarea id='prompt' placeholder="Write your prompt" rows="4" bind:value={prompt} on:blur={saveSettings} />
  </div>
</div>