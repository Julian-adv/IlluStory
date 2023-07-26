<script lang="ts">
  import { Label, Input, Select, Textarea, Button } from 'flowbite-svelte'
  import { onMount } from 'svelte';
  import { openAiApiKey } from '$lib/store';
  import { loadSettings, saveSettings } from '$lib/fs';

  onMount(async () => {
    await loadSettings()
  });

  function save() {
    saveSettings();
  }
</script>

<h1 class='text-lg font-semibold mb-1'>Settings</h1>
<div class='grid grid-cols-[8rem,1fr] gap-2'>
  <div class='w-32 flex'>
    <Label for='openAIKey' class='text-base self-center text-right w-full'>Open AI API Key</Label>
  </div>
  <div class=''>
    <Input id='openAIKey' placeholder="sk-xxxxx" bind:value={$openAiApiKey} on:blur={save} />
  </div>
</div>