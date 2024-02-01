<script lang="ts">
  import { Button, Checkbox, Toast } from 'flowbite-svelte'
  import { onMount, tick } from 'svelte'
  import { savePreset, saveObjQuietly } from '$lib/fs'
  import {
    changeApi,
    roles,
    countTokensApi,
    startStory,
    charSetting,
    userSetting,
    systemRole,
    chatHistory,
    assocMemory,
    lorebookRole,
    loadModels
  } from '$lib/api'
  import { preset, presetPath, fileDialog, defaultPreset, maxMemory } from '$lib/store'
  import { Api, type SelectItem } from '$lib/interfaces'
  import StringField from '../common/StringField.svelte'
  import SelectField from '../common/SelectField.svelte'
  import NumberField from '../common/NumberField.svelte'
  import ImageField from '../common/ImageField.svelte'
  import TextField from '../common/TextField.svelte'
  import FlexibleTextarea from '../common/FlexibleTextarea.svelte'
  import DropSelect from '../common/DropSelect.svelte'
  import { getUniqueId } from '$lib'
  import CheckField from '../common/CheckField.svelte'
  import { slide } from 'svelte/transition'
  import { InfoCircleSolid } from 'flowbite-svelte-icons'
  import { importPresetDialog, loadPresetDialog } from '$lib/preset'
  import FileDialog from '$lib/FileDialog.svelte'
  import DragAndDropList from '../common/DragAndDropList.svelte'
  import VisualizeMode from '../common/VisualizeMode.svelte'
  import NumberListField from '../common/NumberListField.svelte'
  import { nameToPreset } from '$lib/apiOobabooga'

  const apis = [
    { value: Api.OpenAi, name: 'Open AI' },
    { value: Api.Oobabooga, name: 'Oobabooga' },
    { value: Api.KoboldAi, name: 'Kobold AI' }
  ]
  const parameterPresets = [
    { value: 'Big O', name: 'Big O' },
    { value: 'Contrastive Search', name: 'Contrastive Search' },
    { value: 'Debug-deterministic', name: 'Debug-deterministic' },
    { value: 'Default', name: 'Default' },
    { value: 'Divine Intellect', name: 'Divine Intellect' },
    { value: 'LLaMA-Precise', name: 'LLaMA-Precise' },
    { value: 'Midnight Enigma', name: 'Midnight Enigma' },
    { value: 'Null preset', name: 'Null preset' },
    { value: 'Shortwave', name: 'Shortwave' },
    { value: 'simple-1', name: 'simple-1' },
    { value: 'Yara', name: 'Yara' }
  ]
  const chatModes = [
    { value: 'chat', name: 'Chat' },
    { value: 'instruct', name: 'Instruct' },
    { value: 'chat-instruct', name: 'Chat + Instruct' }
  ]
  const instructionTemplates = [
    { value: 'Airoboros-v1.2', name: 'Airoboros-v1.2' },
    { value: 'Alpaca', name: 'Alpaca' },
    { value: 'Bactrian', name: 'Bactrian' },
    { value: 'Baichuan Chat', name: 'Baichuan Chat' },
    { value: 'Baize', name: 'Baize' },
    { value: 'Bluemoon', name: 'Bluemoon' },
    { value: 'ChatGLM', name: 'ChatGLM' },
    { value: 'ChatML', name: 'ChatML' },
    { value: 'Chinese-Vicuna-Chat', name: 'Chinese-Vicuna-Chat' },
    { value: 'Default', name: 'Default' },
    { value: 'Galactica Cite', name: 'Galactica Cite' },
    { value: 'Galactica Finetuned', name: 'Galactica Finetuned' },
    { value: 'Galactica Q', name: 'Galactica Q' },
    { value: 'Galactica Summary', name: 'Galactica Summary' },
    { value: 'Galactica v2', name: 'Galactica v2' },
    { value: 'Galactica Work', name: 'Galactica Work' },
    { value: 'Galactica', name: 'Galactica' },
    { value: 'Gorilla', name: 'Gorilla' },
    { value: 'Guanaco non-chat', name: 'Guanaco non-chat' },
    { value: 'Guanaco-QLoRA', name: 'Guanaco-QLoRA' },
    { value: 'H2O-prompt_answer', name: 'H2O-prompt_answer' },
    { value: 'Hippogriff', name: 'Hippogriff' },
    { value: 'INCITE-Chat', name: 'INCITE-Chat' },
    { value: 'INCITE-Instruct', name: 'INCITE-Instruct' },
    { value: 'Koala', name: 'Koala' },
    { value: 'KoAlpaca', name: 'KoAlpaca' },
    { value: 'Llama-v2', name: 'Llama-v2' },
    { value: 'LLaVA', name: 'LLaVA' },
    { value: 'Manticore Chat', name: 'Manticore Chat' },
    { value: 'Metharme', name: 'Metharme' },
    { value: 'Mistral', name: 'Mistral' },
    { value: 'MOSS', name: 'MOSS' },
    { value: 'NewHope', name: 'NewHope' },
    { value: 'Open Assistant', name: 'Open Assistant' },
    { value: 'OpenBuddy', name: 'OpenBuddy' },
    { value: 'OpenChat', name: 'OpenChat' },
    { value: 'OpenOrca-Platypus2', name: 'OpenOrca-Platypus2' },
    { value: 'Orca Mini', name: 'Orca Mini' },
    { value: 'Orca-Vicuna', name: 'Orca-Vicuna' },
    { value: 'RWKV-Raven', name: 'RWKV-Raven' },
    { value: 'Samantha', name: 'Samantha' },
    { value: 'StableBeluga2', name: 'StableBeluga2' },
    { value: 'StableLM', name: 'StableLM' },
    { value: 'StableVicuna', name: 'StableVicuna' },
    { value: 'Starchat-Beta', name: 'Starchat-Beta' },
    { value: 'Synthia-CoT', name: 'Synthia-CoT' },
    { value: 'Synthia', name: 'Synthia' },
    { value: 'Tulu', name: 'Tulu' },
    { value: 'Vicuna-v0', name: 'Vicuna-v0' },
    { value: 'Vicuna-v1.1', name: 'Vicuna-v1.1' },
    { value: 'Vigogne-Chat', name: 'Vigogne-Chat' },
    { value: 'Vigogne-Instruct', name: 'Vigogne-Instruct' },
    { value: 'Wizard-Mega ShareGPT', name: 'Wizard-Mega ShareGPT' },
    { value: 'Wizard-Mega', name: 'Wizard-Mega' },
    { value: 'Ziya', name: 'Ziya' }
  ]
  let autoSave = true
  let totalTokens = 0

  interface Model {
    name: string
  }

  onMount(async () => {
    totalTokens = 0
    models = await getModels()
  })

  async function addPrompt() {
    await tick()
    $preset.prompts = [
      ...$preset.prompts,
      { id: $preset.prompts.length, role: systemRole, content: '' }
    ]
  }

  function onModelOverview() {
    open('https://platform.openai.com/docs/models/overview')
  }

  let toastMessage = ''

  function closeToast() {
    toastMessage = ''
  }

  function showToast(message: string) {
    toastMessage = message
    setTimeout(closeToast, 9000)
  }

  async function load() {
    try {
      const [tempPreset, tempFilePath] = await loadPresetDialog()
      if (tempPreset) {
        $preset = tempPreset
        $presetPath = tempFilePath
        totalTokens = 0
      }
    } catch (error) {
      showToast('Error: ' + error)
    }
  }

  async function importPreset() {
    try {
      const tempPreset = await importPresetDialog()
      if (tempPreset) {
        $preset = tempPreset
        totalTokens = 0
      }
    } catch (error) {
      showToast('Error: ' + error)
    }
  }

  async function save() {
    const tempFilePath = await savePreset($preset)
    if (tempFilePath) {
      $presetPath = tempFilePath
      totalTokens = 0
    }
  }

  async function autoSaveFunc() {
    if (autoSave && $presetPath !== '') {
      let id = 0
      $preset.prompts.forEach(prompt => {
        prompt.id = id++
      })
      $preset.prompts = $preset.prompts
      await saveObjQuietly($presetPath, $preset)
      totalTokens = 0
    }
  }

  let models: SelectItem[] = []

  async function getModels(): Promise<SelectItem[]> {
    if (models.length === 0) {
      models = await loadModels($preset)
      models = models.sort((modelA: Model, modelB: Model) =>
        modelA.name < modelB.name ? -1 : modelA.name > modelB.name ? 1 : 0
      )
    }
    return models
  }

  async function apiChange(value: string) {
    changeApi(value as Api)
    models = await getModels()
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

  function onChangeParameterPreset(value: string) {
    let paramPreset = nameToPreset[value]
    $preset.oobabooga = {
      ...defaultPreset.oobabooga,
      ...paramPreset
    }
    $preset.oobabooga.preset = value
    $preset.koboldAi = {
      ...defaultPreset.koboldAi,
      ...paramPreset
    }
    autoSaveFunc()
  }
</script>

<div class="px-4">
  <input type="file" id="fileInput" class="hidden" />
  <h1 class="text-lg font-semibold mb-1">Preset Editing</h1>
  <FileDialog
    bind:openDialog={$fileDialog.open}
    bind:ext={$fileDialog.ext}
    bind:value={$fileDialog.value}
    bind:title={$fileDialog.title} />
  <Toast
    color="orange"
    transition={slide}
    open={!!toastMessage}
    class="fixed mx-auto my-8 top-auto inset-x-0 z-30">
    <InfoCircleSolid name="info-circle-solid" slot="icon" class="w-4 h-4" />
    {toastMessage}
  </Toast>
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
    <Button color="alternative" size="sm" on:click={importPreset}>
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
  <div class="grid grid-cols-[9rem,6rem,1fr] gap-0">
    <StringField label="File path" size="sm" disabled bind:value={$presetPath} />
    <ImageField
      label="Image"
      help="An image to show in the preset card."
      bind:value={$preset.image}
      width={512}
      height={768}
      save={autoSaveFunc} />
    <StringField
      label="Title"
      placeholder="Enter title"
      help="Title of this preset."
      bind:value={$preset.title}
      save={autoSaveFunc} />
    <SelectField
      label="API"
      items={apis}
      help="API to use."
      search={false}
      bind:value={$preset.api}
      save={apiChange} />
    <CheckField label="Text streaming" help="" bind:value={$preset.streaming} save={autoSaveFunc} />
    <CheckField label="Narrator mode" help="User plays as narrator." bind:value={$preset.narratorMode} save={autoSaveFunc} />
    {#if $preset.api === Api.OpenAi}
      <StringField
        label="URL"
        placeholder="For example, https://api.openai.com/v1"
        bind:value={$preset.openAi.apiUrl}
        save={autoSaveFunc} />
      <SelectField
        label="Models"
        items={models}
        search={true}
        bind:value={$preset.openAi.model}
        save={autoSaveFunc}>
        <p slot="helper">
          See Open AI's <a
            href="https://platform.openai.com/docs/models/overview"
            target="_blank"
            on:click={onModelOverview}
            class="text-sky-700">Model overview</a> for descriptions of them.
        </p>
      </SelectField>

      <NumberField
        label="Temperature"
        help="Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic."
        bind:value={$preset.openAi.temperature}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Frequency penalty"
        help="Positive values reduce the model's tendency to repeat itself."
        bind:value={$preset.openAi.frequencyPenalty}
        min={-2.0}
        max={2.0}
        save={autoSaveFunc} />
      <NumberField
        label="Presence penalty"
        help="Positive values help the model to transition to new topics."
        bind:value={$preset.openAi.presencePenalty}
        min={-2.0}
        max={2.0}
        save={autoSaveFunc} />
      <NumberField
        label="Max tokens"
        help="The maximum number of tokens to generate in the completion."
        bind:value={$preset.openAi.maxTokens}
        min={48}
        max={1024}
        step={8}
        save={autoSaveFunc} />
      <NumberField
        label="Context size"
        help="Represents the model's context size. If story tokens near this, the old chats will be stored and removed."
        bind:value={$preset.openAi.contextSize}
        min={512}
        max={128000}
        step={8}
        save={autoSaveFunc} />
    {/if}
    {#if $preset.api === Api.Oobabooga}
      <StringField
        label="URL"
        help="For example, http://localhost:5000/v1"
        placeholder=""
        bind:value={$preset.oobabooga.apiUrl}
        defaultValue={defaultPreset.oobabooga.apiUrl}
        save={autoSaveFunc} />
      <SelectField
        label="Model"
        items={models}
        search={true}
        bind:value={$preset.oobabooga.model}
        save={autoSaveFunc} />
      <SelectField
        label="Mode"
        items={chatModes}
        bind:value={$preset.oobabooga.mode}
        save={autoSaveFunc} />
      <SelectField
        label="Instruction template"
        items={instructionTemplates}
        search={true}
        bind:value={$preset.oobabooga.instructionTemplate}
        save={autoSaveFunc} />
      <SelectField
        label="Parameter preset"
        items={parameterPresets}
        help="Parameter preset to use."
        search={false}
        bind:value={$preset.oobabooga.preset}
        save={onChangeParameterPreset} />
      <NumberField
        label="Temperature"
        help="Primary factor to control randomness of outputs. 0 = deterministic (only the most likely token is used). Higher value = more randomness."
        bind:value={$preset.oobabooga.temperature}
        defaultValue={defaultPreset.oobabooga.temperature}
        min={0.01}
        max={1.99}
        save={autoSaveFunc} />
      <CheckField
        label="Temperature last"
        help="Makes temperature the last sampler instead of the first. With this, you can remove low probability tokens with a sampler like min_p and then use a high temperature to make the model creative without losing coherency."
        bind:value={$preset.oobabooga.temperature_last}
        defaultValue={defaultPreset.oobabooga.temperature_last}
        save={autoSaveFunc} />
      <CheckField
        label="Dynamic temperature"
        help="Activates Dynamic Temperature. This modifies temperature to range between 'dynatemp_low' (minimum) and 'dynatemp_high' (maximum), with an entropy-based scaling. The steepness of the curve is controlled by 'dynatemp_exponent'"
        bind:value={$preset.oobabooga.dynamic_temperature}
        defaultValue={defaultPreset.oobabooga.dynamic_temperature}
        save={autoSaveFunc} />
      {#if $preset.oobabooga.dynamic_temperature}
        <NumberField
          label="Dynamic temperature low"
          bind:value={$preset.oobabooga.dynatemp_low}
          defaultValue={defaultPreset.oobabooga.dynatemp_low}
          min={0.01}
          max={5.0}
          save={autoSaveFunc} />
        <NumberField
          label="Dynamic temperature high"
          bind:value={$preset.oobabooga.dynatemp_high}
          defaultValue={defaultPreset.oobabooga.dynatemp_high}
          min={0.01}
          max={5.0}
          save={autoSaveFunc} />
        <NumberField
          label="Dynamic temperature exponent"
          bind:value={$preset.oobabooga.dynatemp_exponent}
          defaultValue={defaultPreset.oobabooga.dynatemp_exponent}
          min={0.01}
          max={5.0}
          save={autoSaveFunc} />
      {/if}
      <NumberField
        label="Top p"
        help="If not set to 1, select tokens with probabilities adding up to less than this number. Higher value = higher range of possible random results."
        bind:value={$preset.oobabooga.top_p}
        defaultValue={defaultPreset.oobabooga.top_p}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Min p"
        help="Tokens with probability smaller than `(min_p) * (probability of the most likely token)` are discarded. This is the same as top_a but without squaring the probability."
        bind:value={$preset.oobabooga.min_p}
        defaultValue={defaultPreset.oobabooga.min_p}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Top k"
        help="Similar to top_p, but select instead only the top_k most likely tokens. Higher value = higher range of possible random results."
        bind:value={$preset.oobabooga.top_k}
        defaultValue={defaultPreset.oobabooga.top_k}
        min={0}
        max={100}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Repetition penalty"
        help="Exponential penalty factor for repeating prior tokens. 1 means no penalty, higher value = less repetition, lower value = more repetition."
        bind:value={$preset.oobabooga.repetition_penalty}
        defaultValue={defaultPreset.oobabooga.repetition_penalty}
        min={1.0}
        max={2.0}
        save={autoSaveFunc} />
      <NumberField
        label="Presence penalty"
        help="Similar to repetition_penalty, but with an additive offset on the raw token scores instead of a multiplicative factor. It may generate better results. 0 means no penalty, higher value = less repetition, lower value = more repetition."
        bind:value={$preset.oobabooga.presence_penalty}
        defaultValue={defaultPreset.oobabooga.presence_penalty}
        min={-2.0}
        max={2.0}
        save={autoSaveFunc} />
      <NumberField
        label="Frequency penalty"
        help="Repetition penalty that scales based on how many times the token has appeared in the context. Be careful with this; there's no limit to how much a token can be penalized."
        bind:value={$preset.oobabooga.frequency_penalty}
        defaultValue={defaultPreset.oobabooga.frequency_penalty}
        min={-2.0}
        max={2.0}
        save={autoSaveFunc} />
      <NumberField
        label="Repetition penalty range"
        help="The number of most recent tokens to consider for repetition penalty. 0 makes all tokens be used."
        bind:value={$preset.oobabooga.repetition_penalty_range}
        defaultValue={defaultPreset.oobabooga.repetition_penalty_range}
        min={0}
        max={4096}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Typical p"
        help="If not set to 1, select only tokens that are at least this much more likely to appear than random tokens, given the prior text."
        bind:value={$preset.oobabooga.typical_p}
        defaultValue={defaultPreset.oobabooga.typical_p}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="TFS"
        help="Tries to detect a tail of low-probability tokens in the distribution and removes those tokens. See [this blog post](https://www.trentonbricken.com/Tail-Free-Sampling/) for details. The closer to 0, the more discarded tokens."
        bind:value={$preset.oobabooga.tfs}
        defaultValue={defaultPreset.oobabooga.tfs}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Top a"
        help="Tokens with probability smaller than `(top_a) * (probability of the most likely token)^2` are discarded."
        bind:value={$preset.oobabooga.top_a}
        defaultValue={defaultPreset.oobabooga.top_a}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Epsilon cutoff"
        help="In units of 1e-4; a reasonable value is 3. This sets a probability floor below which tokens are excluded from being sampled."
        bind:value={$preset.oobabooga.epsilon_cutoff}
        defaultValue={defaultPreset.oobabooga.epsilon_cutoff}
        min={0.0}
        max={9.0}
        step={0.01}
        save={autoSaveFunc} />
      <NumberField
        label="Eta cutoff"
        help="In units of 1e-4; a reasonable value is 3. The main parameter of the special Eta Sampling technique. See [this paper](https://arxiv.org/pdf/2210.15191.pdf) for a description."
        bind:value={$preset.oobabooga.eta_cutoff}
        defaultValue={defaultPreset.oobabooga.eta_cutoff}
        min={0.0}
        max={20.0}
        step={0.01}
        save={autoSaveFunc} />
      <NumberField
        label="Guidance scale"
        help="The main parameter for Classifier-Free Guidance (CFG). [The paper](https://arxiv.org/pdf/2306.17806.pdf) suggests that 1.5 is a good value. It can be used in conjunction with a negative prompt or not."
        bind:value={$preset.oobabooga.guidance_scale}
        defaultValue={defaultPreset.oobabooga.guidance_scale}
        min={-0.5}
        max={2.5}
        step={0.05}
        save={autoSaveFunc} />
      <NumberField
        label="Penalty alpha"
        help="Contrastive Search is enabled by setting this to greater than zero and unchecking “do_sample”. It should be used with a low value of top_k, for instance, top_k = 4."
        bind:value={$preset.oobabooga.penalty_alpha}
        defaultValue={defaultPreset.oobabooga.penalty_alpha}
        min={0.0}
        max={5.0}
        step={0.01}
        save={autoSaveFunc} />
      <NumberField
        label="Mirostat mode"
        help="Activates the Mirostat sampling technique. It aims to control perplexity during sampling. See the [paper](https://arxiv.org/abs/2007.14966)."
        bind:value={$preset.oobabooga.mirostat_mode}
        defaultValue={defaultPreset.oobabooga.mirostat_mode}
        min={0}
        max={2}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Mirostat tau"
        help="Set the Mirostat target entropy, parameter tau. According to the Preset Arena, 8 is a good value."
        bind:value={$preset.oobabooga.mirostat_tau}
        defaultValue={defaultPreset.oobabooga.mirostat_tau}
        min={0}
        max={10}
        save={autoSaveFunc} />
      <NumberField
        label="Mirostat eta"
        help="Set the Mirostat learning rate, parameter eta. According to the Preset Arena, 0.1 is a good value."
        bind:value={$preset.oobabooga.mirostat_eta}
        defaultValue={defaultPreset.oobabooga.mirostat_eta}
        min={0}
        max={1}
        save={autoSaveFunc} />
      <CheckField
        label="Do sample"
        help="When unchecked, sampling is entirely disabled, and greedy decoding is used instead (the most likely token is always picked)."
        bind:value={$preset.oobabooga.do_sample}
        defaultValue={defaultPreset.oobabooga.do_sample}
        save={autoSaveFunc} />
      <NumberField
        label="Encoder repetition penalty"
        help="Also known as the “Hallucinations filter”. Used to penalize tokens that are not in the prior text. Higher value = more likely to stay in context, lower value = more likely to diverge."
        bind:value={$preset.oobabooga.encoder_repetition_penalty}
        defaultValue={defaultPreset.oobabooga.encoder_repetition_penalty}
        min={0.8}
        max={1.5}
        save={autoSaveFunc} />
      <NumberField
        label="No repeat ngram size"
        help="If not set to 0, specifies the length of token sets that are completely blocked from repeating at all. Higher values = blocks larger phrases, lower values = blocks words or letters from repeating. Only 0 or high values are a good idea in most cases."
        bind:value={$preset.oobabooga.no_repeat_ngram_size}
        defaultValue={defaultPreset.oobabooga.no_repeat_ngram_size}
        min={0}
        max={20}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Min length"
        help="Minimum generation length in tokens. This is a built-in parameter in the transformers library that has never been very useful. Typically you want to check 'Ban the eos_token' instead."
        bind:value={$preset.oobabooga.min_length}
        defaultValue={defaultPreset.oobabooga.min_length}
        min={0}
        max={2000}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Number of beams"
        help="Number of beams for beam search. 1 means no beam search."
        bind:value={$preset.oobabooga.num_beams}
        defaultValue={defaultPreset.oobabooga.num_beams}
        min={1}
        max={20}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Length penalty"
        help="Used by beam search only. `length_penalty > 0.0` promotes longer sequences, while `length_penalty < 0.0` encourages shorter sequences."
        bind:value={$preset.oobabooga.length_penalty}
        defaultValue={defaultPreset.oobabooga.length_penalty}
        min={-5.0}
        max={5.0}
        step={0.1}
        save={autoSaveFunc} />
      <CheckField
        label="Early stopping"
        help="Used by beam search only. When checked, the generation stops as soon as there are 'num_beams' complete candidates; otherwise, a heuristic is applied and the generation stops when is it very unlikely to find better candidate."
        bind:value={$preset.oobabooga.early_stopping}
        defaultValue={defaultPreset.oobabooga.early_stopping}
        save={autoSaveFunc} />
      <StringField
        label="Seed"
        help="Set the Pytorch seed to this number. Note that some loaders do not use Pytorch (notably llama.cpp), and others are not deterministic (notably ExLlama v1 and v2). For these loaders, the seed has no effect."
        bind:value={$preset.oobabooga.seed}
        defaultValue={defaultPreset.oobabooga.seed}
        save={autoSaveFunc} />
      <NumberField
        label="Max tokens"
        help="The maximum number of tokens to generate in the completion."
        bind:value={$preset.oobabooga.max_tokens}
        defaultValue={defaultPreset.oobabooga.max_tokens}
        min={48}
        max={1024}
        step={8}
        save={autoSaveFunc} />
      <NumberField
        label="Truncation length"
        help="The leftmost tokens are removed if the prompt exceeds this length. Most models require this to be at most 2048. If set 0, use oobabooga's parameter."
        bind:value={$preset.oobabooga.truncation_length}
        defaultValue={defaultPreset.oobabooga.truncation_length}
        min={0}
        max={16384}
        step={256}
        save={autoSaveFunc} />
      <CheckField
        label="Ban the EOS token"
        help="One of the possible tokens that a model can generate is the EOS (End of Sequence) token. When it is generated, the generation stops prematurely. When this parameter is checked, that token is banned from being generated, and the generation will always generate 'max_new_tokens' tokens."
        bind:value={$preset.oobabooga.ban_eos_token}
        defaultValue={defaultPreset.oobabooga.ban_eos_token}
        save={autoSaveFunc} />
      <CheckField
        label="Add the BOS token to the beginning of prompts"
        help="By default, the tokenizer will add a BOS (Beginning of Sequence) token to your prompt. During training, BOS tokens are used to separate different documents. If unchecked, no BOS token will be added, and the model will interpret your prompt as being in the middle of a document instead of at the start of one. This significantly changes the output and can make it more creative."
        bind:value={$preset.oobabooga.add_bos_token}
        defaultValue={defaultPreset.oobabooga.add_bos_token}
        save={autoSaveFunc} />
      <CheckField
        label="Skip special tokens"
        help="When decoding the generated tokens, skip special tokens from being converted to their text representation. Otherwise, BOS appears as `<s>`, EOS as `</s>`, etc."
        bind:value={$preset.oobabooga.skip_special_tokens}
        defaultValue={defaultPreset.oobabooga.skip_special_tokens}
        save={autoSaveFunc} />
    {/if}
    {#if $preset.api === Api.KoboldAi}
      <StringField
        label="URL"
        help="For example, http://localhost:5001/api."
        placeholder=""
        bind:value={$preset.koboldAi.apiUrl}
        save={autoSaveFunc} />
      <SelectField
        label="Parameter preset"
        items={parameterPresets}
        help="Parameter preset to use."
        search={false}
        bind:value={$preset.koboldAi.preset}
        save={onChangeParameterPreset} />
      <NumberField
        label="Temperature"
        help="Primary factor to control randomness of outputs. 0 = deterministic (only the most likely token is used). Higher value = more randomness."
        bind:value={$preset.koboldAi.temperature}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Top p"
        help="If not set to 1, select tokens with probabilities adding up to less than this number. Higher value = higher range of possible random results."
        bind:value={$preset.koboldAi.topP}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Top k"
        help="Similar to top_p, but select instead only the top_k most likely tokens. Higher value = higher range of possible random results."
        bind:value={$preset.koboldAi.topK}
        min={0}
        max={100}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Typical p"
        help="If not set to 1, select only tokens that are at least this much more likely to appear than random tokens, given the prior text."
        bind:value={$preset.koboldAi.typicalP}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="TFS"
        help="Tail Free Sampling, https://www.trentonbricken.com/Tail-Free-Sampling/"
        bind:value={$preset.koboldAi.tfs}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Top a"
        help=""
        bind:value={$preset.koboldAi.topA}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Min p"
        help=""
        bind:value={$preset.koboldAi.minP}
        min={0.0}
        max={1.0}
        save={autoSaveFunc} />
      <NumberField
        label="Repetition penalty"
        help="Exponential penalty factor for repeating prior tokens. 1 means no penalty, higher value = less repetition, lower value = more repetition."
        bind:value={$preset.koboldAi.repetitionPenalty}
        min={1.0}
        max={2.0}
        save={autoSaveFunc} />
      <NumberField
        label="Repetition penalty range"
        help="Higher means it reads farther back into it's memory to try to not repeat itself."
        bind:value={$preset.koboldAi.repetitionPenaltyRange}
        min={0}
        max={4096}
        step={1}
        save={autoSaveFunc} />
      <StringField
        label="Seed"
        help="Set the Pytorch seed to this number. Note that some loaders do not use Pytorch (notably llama.cpp), and others are not deterministic (notably ExLlama v1 and v2). For these loaders, the seed has no effect."
        bind:value={$preset.koboldAi.seed}
        save={autoSaveFunc} />
      <NumberListField
        label="Sampler order"
        help="The order of the sampler, e.g. 6,0,1,3,4,2,5"
        bind:value={$preset.koboldAi.samplerOrder}
        save={autoSaveFunc} />
      <NumberField
        label="Mirostat mode"
        help="Parameter used for mirostat sampling in Llama.cpp, controlling perplexity during text."
        bind:value={$preset.koboldAi.mirostatMode}
        min={0}
        max={2}
        step={1}
        save={autoSaveFunc} />
      <NumberField
        label="Mirostat tau"
        help="Set the Mirostat target entropy, parameter tau."
        bind:value={$preset.koboldAi.mirostatTau}
        min={0}
        max={10}
        save={autoSaveFunc} />
      <NumberField
        label="Mirostat eta"
        help="Set the Mirostat learning rate, parameter eta."
        bind:value={$preset.koboldAi.mirostatEta}
        min={0}
        max={1}
        save={autoSaveFunc} />
      <TextField
        label="System prefix"
        help="String to prefix system role prompt."
        bind:value={$preset.koboldAi.systemPrefix}
        save={autoSaveFunc} />
      <TextField
        label="User prefix"
        help="String to prefix user role prompt."
        bind:value={$preset.koboldAi.userPrefix}
        save={autoSaveFunc} />
      <TextField
        label="Assistant prefix"
        help="String to prefix assistant role prompt."
        bind:value={$preset.koboldAi.assistantPrefix}
        save={autoSaveFunc} />
      <NumberField
        label="Max tokens"
        help="The maximum number of tokens to generate in the completion."
        bind:value={$preset.koboldAi.maxTokens}
        min={48}
        max={1024}
        step={8}
        save={autoSaveFunc} />
      <NumberField
        label="Context size"
        help="Represents the model's context size. If story tokens near this, the old chats will be stored and removed."
        bind:value={$preset.koboldAi.contextSize}
        min={512}
        max={32768}
        step={8}
        save={autoSaveFunc} />
    {/if}
    <TextField
      label="Summarize prompt"
      help="The prompt to use for summarizing the conversation."
      bind:value={$preset.summarizePrompt}
      save={autoSaveFunc} />
    <VisualizeMode bind:mode={$preset.visualizeMode} save={autoSaveFunc} />
  </div>

  <h1 class="text-lg font-semibold mb-1 mt-3">Prompts</h1>
  <DragAndDropList
    bind:items={$preset.prompts}
    itemClass="grid grid-cols-[9rem,1fr] gap-2"
    removesItems
    onChange={autoSaveFunc}
    let:item={prompt}
    let:i>
    <div class="w-36 flex">
      <DropSelect
        items={roles}
        size="sm"
        classStr="text-sm self-start text-center w-full"
        bind:value={$preset.prompts[i].role}
        save={autoSaveFunc} />
    </div>
    <div class="flex items-center w-full text-center">
      {#if prompt.role === startStory}
        <hr class="flex-grow border-t border-dashed border-stone-400" />
        <em class="px-2 text-sm text-stone-500">The story begins from below.</em>
        <hr class="flex-grow border-t border-dashed border-stone-400" />
      {:else if prompt.role === charSetting}
        <div class="flex flex-col">
          <div class="flex">
            <StringField label="Tag" bind:value={$preset.prompts[i].tag} onBlur={autoSaveFunc} />
            <CheckField
              label="Include all characters"
              bind:value={$preset.prompts[i].allChars}
              save={autoSaveFunc} />
          </div>
          <div class="flex">
            <em class="text-xs text-stone-400 pl-2">
              A placeholder for a character description. If tag is not empty, the description is
              enclosed in &lt;tag&gt;. If <strong>Include all characters</strong> is checked, the prompt
              will include the descriptions of all characters registered in the session.
            </em>
          </div>
        </div>
      {:else if prompt.role === userSetting}
        <div class="flex flex-col">
          <div class="flex">
            <StringField label="Tag" bind:value={$preset.prompts[i].tag} onBlur={autoSaveFunc} />
          </div>
          <div class="flex">
            <em class="text-xs text-stone-400 pl-2">
              A placeholder for the user description. If tag is not empty, the description is
              enclosed in &lt;tag&gt;.
            </em>
          </div>
        </div>
      {:else if prompt.role === chatHistory}
        <div class="flex flex-col">
          <div class="flex">
            <StringField
              label="Start index"
              bind:value={$preset.prompts[i].rangeStart}
              defaultValue={0}
              onBlur={autoSaveFunc} />
            <StringField
              label="End index"
              bind:value={$preset.prompts[i].rangeEnd}
              defaultValue="end"
              onBlur={autoSaveFunc} />
          </div>
          <div class="flex">
            <em class="text-xs text-stone-400 pl-2">
              If you put a negative number, it will count from the back. If you put 'end', it will
              output to the end.</em>
          </div>
        </div>
      {:else if prompt.role === assocMemory}
        <div class="flex flex-col w-full text-left">
          <FlexibleTextarea
            id={getUniqueId()}
            placeholder="Write your prompt"
            bind:value={$preset.prompts[i].content}
            on:blur={autoSaveFunc} />
          <span class="text-sm text-stone-400 px-2">Tokens: {countTokens(prompt.content)}</span>
          <div class="flex w-full gap-4">
            <NumberField
              label="Number of scenes"
              bind:value={$preset.prompts[i].rangeStart}
              defaultValue={5}
              save={autoSaveFunc}
              min={1}
              max={maxMemory}
              step={1} />
          </div>
          <div class="flex">
            <em class="text-xs text-stone-400 pl-2">
              Max number of scenes to recall from memory.</em>
          </div>
        </div>
      {:else if prompt.role === lorebookRole}
        <div class="flex">
          <em class="text-xs text-stone-400 pl-2">A placeholder for a lorebook.</em>
        </div>
      {:else}
        <div class="flex flex-col w-full text-left">
          <FlexibleTextarea
            id={getUniqueId()}
            placeholder="Write your prompt"
            bind:value={$preset.prompts[i].content}
            on:blur={autoSaveFunc} />
          <span class="text-sm text-stone-400 px-2">Tokens: {countTokens(prompt.content)}</span>
        </div>
      {/if}
    </div>
  </DragAndDropList>
  <div class="text-base text-stone-500 p-3">Total tokens: {totalTokens}</div>
  <Button size="xs" color="alternative" on:click={addPrompt}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  </Button>
</div>
