<script lang="ts">
  import { Label, Input, Select, Textarea, Button } from 'flowbite-svelte'
  import { onMount } from 'svelte';
  import { openAiApiKey, openAiModel } from '$lib/store';
  import { loadSettings, saveSettings } from '$lib/fs';
  import type { SceneType } from '$lib/interfaces';

  let models = [
    { value: "model", name: "model" }
  ]
  let roles = [
    { value: "system", name: "System" },
    { value: "assistant", name: "Assistant" },
    { value: "user", name: "User" },
  ]
  let prompts: SceneType[] = [{
    id: 0,
    role: 'system',
    content: 'You are a helpful assistant.'
  }];

  onMount(async () => {
    [models, prompts] = await loadSettings()
  });

  function addPrompt() {
    prompts = [...prompts, { id: prompts.length, role: 'system', content: '' } ]
  }

  function save() {
    saveSettings(prompts);
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
  <div class='w-32 flex'>
    <Label for='models' class='text-base self-center text-right w-full'>Model</Label>
  </div>
  <div class=''>
    <Select id='models' items={models} bind:value={$openAiModel} on:change={save} />
  </div>
</div>

<h1 class='text-lg font-semibold mb-1 mt-3'>Prompts</h1>
<div class='grid grid-cols-[8rem,1fr] gap-2 mt-2'>
  {#each prompts as prompt (prompt.id) }
    <div class='w-32 flex'>
      <Select items={roles} size="sm" class='text-sm self-start text-center w-full' bind:value={prompt.role} />
    </div>
    <div class=''>
      <Textarea id='prompt' placeholder="Write your prompt" rows="4" bind:value={prompt.content} on:blur={save} />
    </div>
  {/each}
</div>
<Button size='xs' color='alternative' on:click={addPrompt}>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
</Button>
