<script lang="ts">
  import { Button, Checkbox } from "flowbite-svelte"
  import { onMount, tick } from "svelte"
  import { loadStoryDialog, saveStory, saveObjQuietly } from "$lib/fs"
  import { loadSettings } from "$lib/settings"
  import DragDropList from "$lib/DragDropList.svelte"
  import { changeApi, roles, countTokensApi, startStory, charSetting, userSetting } from "$lib/api"
  import { story, storyPath, curChar, curCharPath, char, charPath, user, userPath } from "$lib/store"
  import { Api, type Char } from "$lib/interfaces"
  import StringField from "../common/StringField.svelte"
  import SelectField from "../common/SelectField.svelte"
  import NumberField from "../common/NumberField.svelte"
  import ImageField from "../common/ImageField.svelte"
  import TextField from "../common/TextField.svelte"
  import FlexibleTextarea from "../common/FlexibleTextarea.svelte"
  import DropSelect from "../common/DropSelect.svelte"
  import { getUniqueId, removeCommonPrefix } from "$lib"
  import { loadCharDialog, cardFromStory } from "$lib/charSettings"
  import { goto } from "$app/navigation"
  import CharCard from "../common/CharCard.svelte"
  import CheckField from "../common/CheckField.svelte"

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
    models = models.sort((modelA, modelB) => (modelA.name < modelB.name ? -1 : (modelA.name > modelB.name ? 1 : 0)))
  })

  async function addPrompt() {
    await tick()
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
      cardFromStory($story, $storyPath)
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
      saveObjQuietly($storyPath, $story)
      totalTokens = 0
    }
  }

  function update(i: number, value: string) {
    $story.prompts[i].content = value
    autoSaveFunc()
  }

  function updateRole(i: number) {
    return (value: string) => {
      $story.prompts[i].role = value
      autoSaveFunc()
    }
  }

  function apiChange(value:string) {
    changeApi(value as Api)
    autoSaveFunc()
  }

  function countTokens(str: string) {
    if (str) {
      const tokens = countTokensApi(str)
      totalTokens += tokens
      return tokens
    }
    return 0
  }

  async function loadCharTo(charIndex: number): Promise<[Char|null, string]> {
    const [tempChar, tempFilePath] = await loadCharDialog()
    if (tempChar) {
      const relativePath = removeCommonPrefix($storyPath, tempFilePath)
      $story.prompts[charIndex].content = relativePath
      autoSaveFunc()
    }
    return [tempChar, tempFilePath]
  }

  function onCharClick(charIndex: number) {
    return async (ev: Event) => {
      ev.stopPropagation()
      const [tempChar, tempFilePath] = await loadCharTo(charIndex)
      if (tempChar) {
        $char = tempChar
        $charPath = tempFilePath
      }
    }
  }

  function onUserClick(charIndex: number) {
    return async (ev: Event) => {
      ev.stopPropagation()
      const [tempChar, tempFilePath] = await loadCharTo(charIndex)
      if (tempChar) {
        $user = tempChar
        $userPath = tempFilePath
      }
    }
  }

  function onEditChar(ev: Event) {
    ev.stopPropagation()
    $curChar = $char
    $curCharPath = $charPath
    goto('/write_char')
  }

  function onEditUser(ev: Event) {
    ev.stopPropagation()
    $curChar = $user
    $curCharPath = $userPath
    goto('/write_char')
  }
</script>

<h1 class='text-lg font-semibold mb-1'>Story Editing</h1>
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
  <StringField label='File path' size='sm' disabled bind:value={$storyPath} />
  <ImageField label='Image' help='An image to show in the story card. If empty, the image from the first scene is used.' bind:value={$story.image} save={autoSaveFunc} />
  <StringField label='Title' placeholder='Enter title' help='Title of this story.' bind:value={$story.title} save={autoSaveFunc} />
  <SelectField label='API' items={apis} help='API to use.' search={false} bind:value={$story.api} save={apiChange} />
  {#if $story.api === Api.OpenAi}
    <StringField label='URL' placeholder='For example, https://api.openai.com/v1' bind:value={$story.openAi.apiUrl} save={autoSaveFunc} />
    <SelectField label='Models' items={models} search={true} bind:value={$story.openAi.model} save={autoSaveFunc} >
      <p slot='helper'>
        See Open AI's <a href='https://platform.openai.com/docs/models/overview' target='_blank' on:click={onModelOverview} class='text-sky-500'>Model overview</a> for descriptions of them.
      </p>
    </SelectField>

    <NumberField label='Temperature' help='Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.' bind:value={$story.openAi.temperature} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Frequency penalty' help="Positive values reduce the model's tendency to repeat itself." bind:value={$story.openAi.frequencyPenalty} min={-2.0} max={2.0} save={autoSaveFunc} />
    <NumberField label='Presence penalty' help="Positive values help the model to transition to new topics." bind:value={$story.openAi.presencePenalty} min={-2.0} max={2.0} save={autoSaveFunc} />
    <NumberField label='Max tokens' help="The maximum number of tokens to generate in the completion." bind:value={$story.openAi.maxTokens} min={50} max={1000} step={1} save={autoSaveFunc} />
    <NumberField label='Context size' help="Represents the model's context size. If story tokens near this, the chat history will be summarized." bind:value={$story.openAi.contextSize} min={512} max={32768} step={1} save={autoSaveFunc} />
  {/if}
  {#if $story.api === Api.Oobabooga}
    <StringField label='URL' placeholder='For example, http://localhost:5000/api/v1/generate' bind:value={$story.oobabooga.apiUrl} save={autoSaveFunc} />
    <NumberField label='Temperature' help='Primary factor to control randomness of outputs. 0 = deterministic (only the most likely token is used). Higher value = more randomness.' bind:value={$story.oobabooga.temperature} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Top p' help="If not set to 1, select tokens with probabilities adding up to less than this number. Higher value = higher range of possible random results." bind:value={$story.oobabooga.topP} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Top k' help="Similar to top_p, but select instead only the top_k most likely tokens. Higher value = higher range of possible random results." bind:value={$story.oobabooga.topK} min={0} max={100} step={1} save={autoSaveFunc} />
    <NumberField label='Typical p' help="If not set to 1, select only tokens that are at least this much more likely to appear than random tokens, given the prior text." bind:value={$story.oobabooga.typicalP} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Top a' help="" bind:value={$story.oobabooga.topA} min={0.0} max={1.0} save={autoSaveFunc} />
    <NumberField label='Repetition penalty' help="Exponential penalty factor for repeating prior tokens. 1 means no penalty, higher value = less repetition, lower value = more repetition." bind:value={$story.oobabooga.repetitionPenalty} min={1.0} max={2.0} save={autoSaveFunc} />
    <NumberField label='Encoder repetition penalty' help="Also known as the “Hallucinations filter”. Used to penalize tokens that are not in the prior text. Higher value = more likely to stay in context, lower value = more likely to diverge." bind:value={$story.oobabooga.encoderRepetitionPenalty} min={0.8} max={1.5} save={autoSaveFunc} />
    <NumberField label='No repeat ngram size' help="If not set to 0, specifies the length of token sets that are completely blocked from repeating at all. Higher values = blocks larger phrases, lower values = blocks words or letters from repeating. Only 0 or high values are a good idea in most cases." bind:value={$story.oobabooga.noRepeatNgramSize} min={0} max={20} step={1} save={autoSaveFunc} />
    <NumberField label='Min length' help="Minimum generation length in tokens." bind:value={$story.oobabooga.minLength} min={0} max={2000} step={1} save={autoSaveFunc} />
    <StringField label='Seed' bind:value={$story.oobabooga.seed} save={autoSaveFunc} />
    <CheckField label='Do sample' help="Whether or not to use sampling ; use greedy decoding otherwise." bind:value={$story.oobabooga.doSample} save={autoSaveFunc} />
    <NumberField label='Penalty alpha' help="Contrastive Search is enabled by setting this to greater than zero and unchecking “do_sample”. It should be used with a low value of top_k, for instance, top_k = 4." bind:value={$story.oobabooga.penaltyAlpha} min={0.0} max={5.0} save={autoSaveFunc} />
    <NumberField label='Number of beams' help="For Beam Search, along with length_penalty and early_stopping." bind:value={$story.oobabooga.numBeams} min={1} max={20} step={1} save={autoSaveFunc} />
    <NumberField label='Length penalty' help="length_penalty > 0.0 promotes longer sequences, while length_penalty < 0.0 encourages shorter sequences." bind:value={$story.oobabooga.lengthPenalty} min={-5.0} max={5.0} step={0.1} save={autoSaveFunc} />
    <CheckField label='Early stopping' help="Controls the stopping condition for beam-based methods, like beam-search." bind:value={$story.oobabooga.earlyStopping} save={autoSaveFunc} />
    <NumberField label='Truncation length' help="The leftmost tokens are removed if the prompt exceeds this length. Most models require this to be at most 2048." bind:value={$story.oobabooga.truncationLength} min={0} max={16384} step={256} save={autoSaveFunc} />
    <CheckField label='Ban the EOS token' help="Forces the model to never end the generation prematurely." bind:value={$story.oobabooga.banEosToken} save={autoSaveFunc} />
    <CheckField label='Add the BOS token to the beginning of prompts' help="Disabling this can make the replies more creative." bind:value={$story.oobabooga.addBosToken} save={autoSaveFunc} />
    <CheckField label='Skip special tokens' help="Some specific models need this unset." bind:value={$story.oobabooga.skipSpecialTokens} save={autoSaveFunc} />
    <StringField label='System prefix' help="String to prefix system role prompt." bind:value={$story.oobabooga.systemPrefix} save={autoSaveFunc} />
    <StringField label='User prefix' help="String to prefix user role prompt." bind:value={$story.oobabooga.userPrefix} save={autoSaveFunc} />
    <StringField label='Assistant prefix' help="String to prefix assistant role prompt." bind:value={$story.oobabooga.assistantPrefix} save={autoSaveFunc} />
    <NumberField label='Max tokens' help="The maximum number of tokens to generate in the completion." bind:value={$story.oobabooga.maxTokens} min={50} max={1000} step={1} save={autoSaveFunc} />
    <NumberField label='Context size' help="Represents the model's context size. If story tokens near this, the chat history will be summarized." bind:value={$story.oobabooga.contextSize} min={512} max={32768} step={1} save={autoSaveFunc} />
  {/if}
  <TextField label='Summarize prompt' help="The prompt to use for summarizing the conversation." bind:value={$story.summarizePrompt} save={autoSaveFunc} />
</div>

<h1 class='text-lg font-semibold mb-1 mt-3'>Prompts</h1>
<DragDropList bind:data={$story.prompts} onChange={autoSaveFunc} removesItems let:datum={prompt} let:i >
  <div class='grid grid-cols-[9rem,1fr] gap-2 mt-2'>
    <div class=' w-36 flex'>
      <DropSelect items={roles} size="sm" classStr='text-sm self-start text-center w-full' value={prompt.role} save={updateRole(i)} />
    </div>
    <div class='flex items-center w-full text-center'>
      {#if prompt.role === startStory}
        <hr class='flex-grow border-t border-dashed border-stone-400'>
        <em class='px-2 text-sm text-stone-500'>The story begins from below.</em>
        <hr class='flex-grow border-t border-dashed border-stone-400'>
      {:else if prompt.role === charSetting}
        <CharCard char={$char} onCharClick={onCharClick(i)} {onEditChar} />
      {:else if prompt.role === userSetting}
        <CharCard char={$user} onCharClick={onUserClick(i)} onEditChar={onEditUser} />
      {:else}
        <div class='flex flex-col w-full text-left'>
          <FlexibleTextarea id={getUniqueId()} placeholder="Write your prompt" value={prompt.content} 
           onUpdate={(text) => update(i, text)} on:blur={autoSaveFunc} />
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