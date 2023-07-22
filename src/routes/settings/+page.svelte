<script lang="ts">
  import { Label, Input } from 'flowbite-svelte'
  import { writeTextFile, BaseDirectory, readTextFile } from '@tauri-apps/api/fs'
  import { onMount } from 'svelte';
  import { openAiApiKey } from '$lib/store';

  const settingsFile = 'settings.json'

  async function saveSettings() {
    const settings = {
      "openAiApiKey": $openAiApiKey
    }
    writeTextFile({ path: settingsFile, contents: JSON.stringify(settings) }, { dir: BaseDirectory.AppConfig })
  }

  onMount(async () => {
    const settingsJson = await readTextFile(settingsFile, { dir: BaseDirectory.AppConfig })
    const settings = JSON.parse(settingsJson)
    openAiApiKey.set(settings.openAiApiKey)
  })
</script>

<h1 class='text-lg font-semibold mb-1'>Settings</h1>
<div class='grid grid-cols-[8rem,1fr] gap-2'>
  <div class='w-32 flex'>
    <Label for='openAIKey' class='text-base self-center text-right w-full'>Open AI API Key</Label>
  </div>
  <div class=''>
    <Input id='default-input' placeholder="sk-xxxxx" bind:value={$openAiApiKey} on:blur={saveSettings} />
  </div>
</div>
