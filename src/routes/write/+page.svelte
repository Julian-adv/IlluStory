<script lang="ts">
  import { Label, Input, Range, Select, Helper, Button, Textarea } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { loadSettings } from "$lib/fs";
  import type { Story } from "$lib/interfaces";
  import { open as openDialog, save } from '@tauri-apps/api/dialog';
  import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";

  let story: Story = {
    title: '',
    model: '',
    temperature: 0.75,
    frequencyPenalty: 0.4,
    presencePenalty: 0.4,
    maxTokens: 500,
    prompts: []
  }
  let models = [{ value: '', name: '' }];
  const helperClassVisible = "text-stone-600";
  const helperClassHidden = "text-stone-100";
  const linkClassVisible = "text-sky-600";
  let helperClass: string[] = [];
  const roles = [
    { value: "system", name: "System" },
    { value: "assistant", name: "Assistant" },
    { value: "user", name: "User" },
  ]

  function showHelper(i: number) {
    return () => {
      helperClass[i] = helperClassVisible;
      console.log('here')
    };
  }

  function hideHelper(i: number) {
    return () => {
      helperClass[i] = helperClassHidden;
    };
  }

  onMount(async () => {
    models = await loadSettings()
    for (let i = 0; i < 6; i++) {
      helperClass[i] = helperClassHidden;
    }
  });

  function addPrompt() {
    story.prompts = [...story.prompts, { id: story.prompts.length, role: 'system', content: '' } ]
  }

  function onModelOverview() {
    open('https://platform.openai.com/docs/models/overview')
  }

  function linkClass(cl: string): string {
    if (cl === helperClassHidden) {
      return helperClassHidden;
    } else {
      return linkClassVisible;
    }
  }

  async function load() {
    const selected = await openDialog({ filters: [{ name: '*', extensions: ['json']}]});
    console.log('selected', selected)
    if (typeof(selected) === 'string' ) {
      const json = await readTextFile(selected);
      story = JSON.parse(json) as Story;
      console.log('story', story)
    }
  }

  async function saveStory() {
    let fileName = story.title.replace(/[<>:"/\\|?*]/g, '_').trim();
    if (fileName === '') {
      fileName = 'story' + Date.now() + '.json'
    } else {
      fileName = fileName + '.json'
    }
    const filePath = await save({ defaultPath: fileName, filters: [{ name: '*', extensions: ['json'] }] })
    if (filePath) {
      console.log('story', story)
      writeTextFile(filePath, JSON.stringify(story))
    }
  }

  async function autoSave() {
    
  }
</script>
<div class='mb-5'>
  <Button color='alternative' size='sm' on:click={load}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
    </svg>Load
  </Button>
  <Button color='alternative' size='sm' on:click={saveStory}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>Save
  </Button>
  
</div>
<div class='grid grid-cols-[9rem,5rem,1fr] gap-2'>
  <div class='w-36 flex'>
    <Label for='title' class='text-base self-center text-right w-full'>Title</Label>
  </div>
  <div class='col-span-2'>
    <Input id='title' placeholder="title" bind:value={story.title} on:blur={autoSave} on:mouseenter={showHelper(0)} on:mouseleave={hideHelper(0)} />
  </div>
  <div>
  </div>
  <div class='col-span-2'>
    <Helper class={helperClass[0]}>Title of this story.</Helper>
  </div>

  <div class='w-32 flex'>
    <Label for='models' class='text-base self-center text-right w-full'>Model</Label>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='col-span-2' on:mouseenter={showHelper(1)} on:mouseleave={hideHelper(1)}>
    <Select id='models' items={models} bind:value={story.model} on:change={autoSave} />
  </div>
  <div>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='col-span-2' on:mouseenter={showHelper(1)} on:mouseleave={hideHelper(1)}>
    <Helper class={helperClass[1]}>See our <a href='https://platform.openai.com/docs/models/overview' target="_blank" on:click={onModelOverview} class={linkClass(helperClass[1])}>Model overview</a> for descriptions of them.</Helper>
  </div>

  <div class='w-36 flex'>
    <Label for='temperature' class='text-base self-center text-right w-full'>Temperature</Label>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='' on:mouseenter={showHelper(2)} on:mouseleave={hideHelper(2)}>
    <Input type="number" id='Temperature' bind:value={story.temperature} on:blur={autoSave} step='0.01' />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(2)} on:mouseleave={hideHelper(2)}>
    <Range id='temperature' size='sm' bind:value={story.temperature} min='0' max='2.0' step='0.01' class='self-center'/>
  </div>
  <div>
  </div>
  <div class='col-span-2'>
    <Helper class={helperClass[2]}>Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.</Helper>
  </div>

  <div class='w-36 flex'>
    <Label for='frequencyPenalty' class='text-base self-center text-right w-full'>Frequency penalty</Label>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='' on:mouseenter={showHelper(3)} on:mouseleave={hideHelper(3)}>
    <Input type="number" id='frequencyPenalty' bind:value={story.frequencyPenalty} on:blur={autoSave} step='0.01' />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(3)} on:mouseleave={hideHelper(3)}>
    <Range id='frequencyPenalty' size='sm' bind:value={story.frequencyPenalty} min='-2.0' max='2.0' step='0.01' class='self-center'/>
  </div>
  <div>
  </div>
  <div class='col-span-2'>
    <Helper class={helperClass[3]}>Positive values reduce the model's tendency to repeat itself.</Helper>
  </div>

  <div class='w-36 flex'>
    <Label for='presencePenalty' class='text-base self-center text-right w-full'>Presence penalty</Label>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='' on:mouseenter={showHelper(4)} on:mouseleave={hideHelper(4)}>
    <Input type="number" id='presencePenalty' bind:value={story.presencePenalty} on:blur={autoSave} step='0.01' />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(4)} on:mouseleave={hideHelper(4)}>
    <Range id='frequencyPenalty' size='sm' bind:value={story.presencePenalty} min='-2.0' max='2.0' step='0.01' class='self-center'/>
  </div>
  <div>
  </div>
  <div class='col-span-2'>
    <Helper class={helperClass[4]}>Positive values help the model to transition to new topics.</Helper>
  </div>

  <div class='w-36 flex'>
    <Label for='maxTokens' class='text-base self-center text-right w-full'>Max tokens</Label>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='' on:mouseenter={showHelper(5)} on:mouseleave={hideHelper(5)}>
    <Input type="number" id='maxTokens' bind:value={story.maxTokens} on:blur={autoSave} />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(5)} on:mouseleave={hideHelper(5)}>
    <Range id='maxTokens' size='sm' bind:value={story.maxTokens} min='1' max='1024' step='1' class='self-center'/>
  </div>
  <div>
  </div>
  <div class='col-span-2'>
    <Helper class={helperClass[5]}>The maximum number of tokens to generate in the completion.</Helper>
  </div>
</div>
<h1 class='text-lg font-semibold mb-1 mt-3'>Prompts</h1>
<div class='grid grid-cols-[8rem,1fr] gap-2 mt-2'>
  {#each story.prompts as prompt (prompt.id) }
    <div class='w-32 flex'>
      <Select items={roles} size="sm" class='text-sm self-start text-center w-full' bind:value={prompt.role} />
    </div>
    <div class=''>
      <Textarea id='prompt' placeholder="Write your prompt" rows="4" bind:value={prompt.content} on:blur={autoSave} />
    </div>
  {/each}
</div>
<Button size='xs' color='alternative' on:click={addPrompt}>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
</Button>