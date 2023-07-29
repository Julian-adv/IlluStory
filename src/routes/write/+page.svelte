<script lang="ts">
  import { Label, Input, Range, Select, Helper, Button, Textarea, Checkbox } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { loadSettings, loadStory, saveStory, saveStoryQuietly } from "$lib/fs";
  import DragDropList from "$lib/DragDropList.svelte";
  import { roles, startStory } from "$lib/api";
  import { story, storyPath } from "$lib/store";
  import type { Prompt } from "$lib/interfaces";

  let models = [{ value: '', name: '' }];
  const helperClassVisible = "text-stone-600";
  const helperClassHidden = "text-stone-100";
  const linkClassVisible = "text-sky-600";
  let helperClass: string[] = [
    helperClassHidden,
    helperClassHidden,
    helperClassHidden,
    helperClassHidden,
    helperClassHidden,
    helperClassHidden,
  ];
  let autoSave = true;

  function showHelper(i: number) {
    return () => {
      helperClass[i] = helperClassVisible;
    };
  }

  function hideHelper(i: number) {
    return () => {
      helperClass[i] = helperClassHidden;
    };
  }

  onMount(async () => {
    models = await loadSettings()
    for (let i = 0; i < helperClass.length; i++) {
      helperClass[i] = helperClassHidden;
    }
  });

  function addPrompt() {
    $story.prompts = [...$story.prompts, { id: $story.prompts.length, role: 'system', content: '' } ]
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
    const [tempStory, tempFilePath] = await loadStory();
    if (tempStory) {
      $story = tempStory;
      $storyPath = tempFilePath;
    }
  }

  async function save() {
    const tempFilePath = await saveStory($story);
    if (tempFilePath) {
      $storyPath = tempFilePath;
    }
  }

  async function autoSaveFunc() {
    if (autoSave && $storyPath !== '') {
      let id = 0;
      $story.prompts.forEach(prompt => {
        prompt.id = id++;
      });
      $story.prompts = $story.prompts;
      saveStoryQuietly($storyPath, $story)
    }
  }

  function update(i: number, value: string) {
    return (e:Event) => {
      $story.prompts[i].content = value;
    }
  }

  function updateRole(i: number, element: HTMLOptionElement) {
    return (e:Event) => {
      $story.prompts[i].role = element.value;
    }
  }

  function countLines(prompt: Prompt): number {
    let count = 0;
    const str = prompt.content;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "\n") {
        count++;
      }
    }
    if (count < 4) {
      count = 4;
    }
    if (count > 15) {
      count = 15;
    }
    return count;
  }
</script>
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
<div class='grid grid-cols-[9rem,5rem,1fr] gap-2'>
  <div class='w-36 flex'>
    <Label for='filePath' class='text-base self-center text-right w-full'>File path</Label>
  </div>
  <div class='col-span-2'>
    <Input id='filePath' size='sm' bind:value={$storyPath} disabled />
  </div>

  <div class='w-36 flex'>
    <Label for='title' class='text-base self-center text-right w-full'>Title</Label>
  </div>
  <div class='col-span-2'>
    <Input id='title' placeholder="title" bind:value={$story.title} on:blur={autoSaveFunc} on:mouseenter={showHelper(0)} on:mouseleave={hideHelper(0)} />
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
    <Select id='models' items={models} bind:value={$story.model} on:change={autoSaveFunc} />
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
    <Input type="number" id='Temperature' bind:value={$story.temperature} on:blur={autoSaveFunc} step='0.01' />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(2)} on:mouseleave={hideHelper(2)}>
    <Range id='temperature' size='sm' bind:value={$story.temperature} min='0' max='2.0' step='0.01' class='self-center'/>
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
    <Input type="number" id='frequencyPenalty' bind:value={$story.frequencyPenalty} on:blur={autoSaveFunc} step='0.01' />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(3)} on:mouseleave={hideHelper(3)}>
    <Range id='frequencyPenalty' size='sm' bind:value={$story.frequencyPenalty} min='-2.0' max='2.0' step='0.01' class='self-center'/>
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
    <Input type="number" id='presencePenalty' bind:value={$story.presencePenalty} on:blur={autoSaveFunc} step='0.01' />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(4)} on:mouseleave={hideHelper(4)}>
    <Range id='frequencyPenalty' size='sm' bind:value={$story.presencePenalty} min='-2.0' max='2.0' step='0.01' class='self-center'/>
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
    <Input type="number" id='maxTokens' bind:value={$story.maxTokens} on:blur={autoSaveFunc} />
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class='flex' on:mouseenter={showHelper(5)} on:mouseleave={hideHelper(5)}>
    <Range id='maxTokens' size='sm' bind:value={$story.maxTokens} min='1' max='1024' step='1' class='self-center'/>
  </div>
  <div>
  </div>
  <div class='col-span-2'>
    <Helper class={helperClass[5]}>The maximum number of tokens to generate in the completion.</Helper>
  </div>
</div>

<h1 class='text-lg font-semibold mb-1 mt-3'>Prompts</h1>
<DragDropList bind:data={$story.prompts} onChange={autoSaveFunc} removesItems let:datum={prompt} let:i >
  <div class='grid grid-cols-[8rem,1fr] gap-2 mt-2'>
    <div class='w-32 flex'>
      <Select items={roles} size="sm" class='text-sm self-start text-center w-full' value={prompt.role} on:change={updateRole(i, this)} />
    </div>
    <div class='flex items-center w-full text-center'>
      {#if prompt.role === startStory}
        <hr class='flex-grow border-t border-dashed border-stone-400'>
        <em class='px-2 text-sm text-stone-500'>The story begins from below.</em>
        <hr class='flex-grow border-t border-dashed border-stone-400'>
      {:else}
        <Textarea id='prompt' placeholder="Write your prompt" rows={countLines(prompt)} value={prompt.content} 
         on:change={update(i, this.value)} on:blur={autoSaveFunc} />
      {/if}
    </div>
  </div>
</DragDropList>
<Button size='xs' color='alternative' on:click={addPrompt}>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
</Button>
