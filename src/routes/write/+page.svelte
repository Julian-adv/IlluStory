<script lang="ts">
  import { Label, Input, Select, Button, Textarea, Checkbox } from "flowbite-svelte"
  import { onMount } from "svelte"
  import { loadStoryDialog, saveStory, saveStoryQuietly } from "$lib/fs"
  import { loadSettings } from "$lib/settings"
  import DragDropList from "$lib/DragDropList.svelte"
  import { changeApi, roles, countTokensApi, startStory } from "$lib/api"
  import { story, storyPath } from "$lib/store"
  import { Api } from "$lib/interfaces"
  import StringField from "../common/StringField.svelte"
  import SelectField from "../common/SelectField.svelte"
  import NumberField from "../common/NumberField.svelte"
  import ImageField from "../common/ImageField.svelte"
  import TextField from "../common/TextField.svelte"
  import FlexibleTextarea from "../common/FlexibleTextarea.svelte";
  import { getUniqueId } from "$lib";

  let models = [{ value: '', name: '' }]
  const apis = [
    { value: Api.OpenAi, name: 'Open AI'},
    { value: Api.Oobabooga, name: 'Oobabooga' }
  ]
  let autoSave = true
  let totalTokens = 0

  onMount(async () => {
    totalTokens = 0
    models = await loadSettings()
  })

  function addPrompt() {
    $story.prompts = [...$story.prompts, { id: $story.prompts.length, role: 'system', content: '' } ]
  }

  function onModelOverview() {
    open('https://platform.openai.com/docs/models/overview')
  }

  async function load() {
    const [tempStory, tempFilePath] = await loadStoryDialog()
    if (tempStory) {
      $story = tempStory
      $storyPath = tempFilePath
      totalTokens = 0
    }
  }

  async function save() {
    const tempFilePath = await saveStory($story)
    if (tempFilePath) {
      $storyPath = tempFilePath
      totalTokens = 0
    }
  }

  async function autoSaveFunc() {
    if (autoSave && $storyPath !== '') {
      let id = 0
      $story.prompts.forEach(prompt => {
        prompt.id = id++
      })
      $story.prompts = $story.prompts
      saveStoryQuietly($storyPath, $story)
      totalTokens = 0
    }
  }

  function update(i: number, value: string) {
    return (_e: Event) => {
      $story.prompts[i].content = value
    }
  }

  function updateRole(i: number, element: HTMLOptionElement) {
    return (_e: Event) => {
      $story.prompts[i].role = element.value
    }
  }

  function apiChange(value:string) {
    changeApi(value as Api)
    autoSaveFunc()
  }

  function countTokens(str: string) {
    const tokens = countTokensApi(str)
    totalTokens += tokens
    return tokens
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
<div class='grid grid-cols-[9rem,5rem,1fr] gap-0'>
  <div class='w-36 flex p-1'>
    <Label for='filePath' class='text-base self-center text-right w-full'>File path</Label>
  </div>
  <div class='col-span-2 p-1'>
    <Input id='filePath' size='sm' bind:value={$storyPath} disabled />
  </div>

  <ImageField label='Image' help='An image to represent this story. If empty, the image from the first scene is used.' bind:value={$story.image} save={autoSaveFunc} />
  <StringField label='Title' placeholder='Enter title' help='Title of this story.' bind:value={$story.title} save={autoSaveFunc} />
  <SelectField label='API' items={apis} help='API to use.' bind:value={$story.api} save={apiChange} />
  {#if $story.api === Api.OpenAi}
    <StringField label='URL' placeholder='https://api.openai.com/v1' bind:value={$story.apiUrl} save={autoSaveFunc} />
    <SelectField label='Models' items={models} bind:value={$story.model} save={autoSaveFunc} >
      <p slot='helper'>
        See our <a href='https://platform.openai.com/docs/models/overview' target='_blank' on:click={onModelOverview} class='text-sky-500'>Model overview</a> for descriptions of them.
      </p>
    </SelectField>

    <NumberField label='Temperature' help='Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.' bind:value={$story.temperature} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Frequency penalty' help="Positive values reduce the model's tendency to repeat itself." bind:value={$story.frequencyPenalty} min={-2.0} max={2.0} save={autoSaveFunc} />
    <NumberField label='Presence penalty' help="Positive values help the model to transition to new topics." bind:value={$story.presencePenalty} min={-2.0} max={2.0} save={autoSaveFunc} />
  {/if}
  {#if $story.api === Api.Oobabooga}
    <NumberField label='Temperature' help='Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.' bind:value={$story.temperature} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Top k' help="The number of highest probability vocabulary tokens to keep for top-k-filtering." bind:value={$story.topK} min={0.0} max={2.0} save={autoSaveFunc} />
    <NumberField label='Top p' help="If set to float < 1, only the smallest set of most probable tokens with probabilities that add up to top_p or higher are kept for generation." bind:value={$story.topP} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Typical p' help="If set to float < 1, the smallest set of the most locally typical tokens with probabilities that add up to typical_p or higher are kept for generation." bind:value={$story.typicalP} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Length penalty' help="length_penalty > 0.0 promotes longer sequences, while length_penalty < 0.0 encourages shorter sequences." bind:value={$story.lengthPenalty} min={-5.0} max={5.0} save={autoSaveFunc} />
    <NumberField label='Repetition penalty' help="The parameter for repetition penalty. 1.0 means no penalty." bind:value={$story.repetitionPenalty} min={1.0} max={2.0} save={autoSaveFunc} />
    <NumberField label='Penalty alpha' help="The values balance the model confidence and the degeneration penalty in contrastive search decoding." bind:value={$story.penaltyAlpha} min={0.0} max={5.0} save={autoSaveFunc} />
  {/if}
  <NumberField label='Max tokens' help="The maximum number of tokens to generate in the completion." bind:value={$story.maxTokens} min={50} max={1000} step={1} save={autoSaveFunc} />
  <NumberField label='Context size' help="Represents the model's context size. If story tokens near this, the chat history will be summarized." bind:value={$story.contextSize} min={512} max={32768} step={1} save={autoSaveFunc} />
  <TextField label='Summarize prompt' help="The prompt to use for summarizing the conversation." bind:value={$story.summarizePrompt} save={autoSaveFunc} />
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
        <div class='flex flex-col w-full text-left'>
          <FlexibleTextarea id={getUniqueId()} placeholder="Write your prompt" value={prompt.content} 
           on:change={update(i, this.value)} on:blur={autoSaveFunc} />
          <span class='text-sm text-stone-400 px-2'>Tokens: {countTokens(prompt.content)}</span>
        </div>
      {/if}
    </div>
  </div>
</DragDropList>
<div class='text-base text-stone-500 p-3'>Total tokens: {totalTokens}</div>
<Button size='xs' color='alternative' on:click={addPrompt}>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
</Button>
