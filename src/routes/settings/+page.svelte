<script lang="ts">
  import { onMount } from 'svelte'
  import { settings } from '$lib/store'
  import { loadSettings, saveSettings } from '$lib/settings'
  import StringField from '../common/StringField.svelte'
  import CheckField from '../common/CheckField.svelte'
  import SampleField from '../common/SampleField.svelte'
  import FontField from '../common/FontField.svelte'
  import NumberField from '../common/NumberField.svelte'
  import TextField from '../common/TextField.svelte'
  import SelectField from '../common/SelectField.svelte'
  import { installDefaults } from '$lib/fs'

  const languages = [
    { value: 'BG', name: 'Bulgarian' },
    { value: 'CS', name: 'Czech' },
    { value: 'DA', name: 'Danish' },
    { value: 'DE', name: 'German' },
    { value: 'EL', name: 'Greek' },
    { value: 'EN-GB', name: 'English (British)' },
    { value: 'EN-US', name: 'English (American)' },
    { value: 'ES', name: 'Spanish' },
    { value: 'ET', name: 'Estonian' },
    { value: 'FI', name: 'Finnish' },
    { value: 'FR', name: 'French' },
    { value: 'HU', name: 'Hungarian' },
    { value: 'ID', name: 'Indonesian' },
    { value: 'IT', name: 'Italian' },
    { value: 'JA', name: 'Japanese' },
    { value: 'KO', name: 'Korean' },
    { value: 'LT', name: 'Lithuanian' },
    { value: 'LV', name: 'Latvian' },
    { value: 'NB', name: 'Norwegian (Bokmål)' },
    { value: 'NL', name: 'Dutch' },
    { value: 'PL', name: 'Polish' },
    { value: 'PT-BR', name: 'Portuguese (Brazilian)' },
    {
      value: 'PT-PT',
      name: 'Portuguese (all Portuguese varieties excluding Brazilian Portuguese)'
    },
    { value: 'RO', name: 'Romanian' },
    { value: 'RU', name: 'Russian' },
    { value: 'SK', name: 'Slovak' },
    { value: 'SL', name: 'Slovenian' },
    { value: 'SV', name: 'Swedish' },
    { value: 'TR', name: 'Turkish' },
    { value: 'UK', name: 'Ukrainian' },
    { value: 'ZH', name: 'Chinese (simplified)' }
  ]

  const imageSources = [
    { value: 'none', name: 'None' },
    { value: 'full_desc', name: 'Full description' },
    { value: 'visual_tag', name: 'Visual tag' }
  ]

  onMount(async () => {
    await installDefaults()
    await loadSettings()
  })

  function save() {
    saveSettings()
  }

  function onDeepLApi() {
    open('https://www.deepl.com/pro-api?cta=header-pro-api')
  }
</script>

<div class="px-4">
  <h1 class="text-lg font-semibold mb-1">Settings</h1>
  <div class="grid grid-cols-[9rem,5rem,1fr] gap-0">
    <StringField
      label="Open AI API Key"
      placeholder="sk-xxxxx"
      help="Open AI API key."
      bind:value={$settings.openAiApiKey}
      {save} />
    <h1 class="text-lg font-semibold mt-4 col-span-3">Stable Diffusion</h1>
    <SelectField
      label="Image source"
      items={imageSources}
      bind:value={$settings.imageSource}
      {save}>
      <em slot="helper">
        {#if $settings.imageSource === 'none'}
          Don't generate an image.
        {:else if $settings.imageSource === 'visual_tag'}
          Generate an image from visual description. You need to instruct AI to generate visual
          description by adding a prompt like this:<br />
          <p class="plain">
            "Add a visual summary at the end of the output. It's crucial to include details about
            &lt;char>'s look, clothing, stance, and nearby setting. The description should be short
            phrases inside &lt;Visual> and &lt;/Visual>. For example: &lt;Visual>brown hair, shirt,
            pants, sitting on a living room &lt;/Visual>"
          </p>
        {:else if $settings.imageSource === 'full_desc'}
          Use the AI's full scene description to generate the image.
        {/if}
      </em>
    </SelectField>
    {#if $settings.imageSource !== 'none'}
      <StringField
        label="URL"
        placeholder=""
        help="Automatic1111's Stable Diffusion web UI server URL. Usually http://localhost:7860"
        bind:value={$settings.sdURL}
        {save} />
      <StringField
        label="Image sizes"
        help="A comma-separated list of image sizes. Example: 512x768, 768x512. One of which is chosen at random."
        bind:value={$settings.imageSizes}
        {save} />
      <NumberField
        label="Steps"
        help="Sampling steps"
        bind:value={$settings.steps}
        min={20}
        max={150}
        step={1}
        {save} />
      <NumberField
        label="CFG Scale"
        help="The CFG scale adjusts how much the image looks closer to the prompt."
        bind:value={$settings.cfgScale}
        min={1}
        max={30}
        step={0.5}
        {save} />
      <TextField
        label="Prompt"
        help="Prompts that should always be included."
        bind:value={$settings.prompt}
        {save} />
      <TextField
        label="Negative prompt"
        help="What shouldn't be in the image."
        bind:value={$settings.negativePrompt}
        {save} />
      <StringField
        label="Sampler"
        help="Example: Euler a, DPM++ SDE Karras, DPM++ 2M SDE Karras"
        bind:value={$settings.sampler}
        {save} />
      <CheckField
        label="Enable Hires"
        help="Whether to enable Hires.fix. It will upscale the image."
        bind:value={$settings.enableHires}
        {save} />
      {#if $settings.enableHires}
        <NumberField
          label="Denoising strength"
          help="Lower value retains the likeness of the input image, while higher strength reduces its influence and introduces more variations."
          bind:value={$settings.denoisingStrength}
          min={0}
          max={1}
          step={0.01}
          {save} />
        <NumberField
          label="Upscale by"
          help="How much to upscale the image."
          bind:value={$settings.hiresScale}
          min={1}
          max={4}
          step={0.05}
          {save} />
        <StringField
          label="Upscaler"
          help="Example: Latent, R-ESRGAN 4x+, 4x-UltraSharp"
          bind:value={$settings.hiresUpscaler}
          {save} />
      {/if}
      <CheckField
        label="Use ADetailer"
        help="Whether to use ADetailer. You need to install adetailer in web UI extensions. It will enhace faces in the image."
        bind:value={$settings.enableADetailer}
        {save} />
      <CheckField
        label="Blur background"
        help="Blur background of the image."
        bind:value={$settings.blurBackground}
        {save} />
    {/if}
    <h1 class="text-lg font-semibold mt-4 col-span-3">Translation</h1>
    <StringField
      label="DeepL API Key"
      placeholder="xxxxx"
      help=""
      bind:value={$settings.deeplApiKey}
      {save}>
      <p slot="helper">
        DeepL API key. You can get it from <a
          href="https://www.deepl.com/pro-api?cta=header-pro-api"
          target="_blank"
          on:click={onDeepLApi}
          class="text-sky-500">DeepL API</a
        >.
      </p>
    </StringField>
    <SelectField
      label="AI language"
      items={languages}
      help="Language to pass to the AI."
      search={true}
      bind:value={$settings.aiLang}
      {save} />
    <SelectField
      label="User language"
      items={languages}
      help="The language the user speaks."
      search={true}
      bind:value={$settings.userLang}
      {save} />
    <CheckField
      label="Automatically translate the AI's output"
      help=""
      bind:value={$settings.translateOutput}
      {save} />
    <CheckField
      label="Automatically translate user input"
      help=""
      bind:value={$settings.translateInput}
      {save} />
    <h1 class="text-lg font-semibold mt-4 col-span-3">Formatting</h1>
    <CheckField
      label="Convert to Markdown"
      help="Convert the AI's output to markdown."
      bind:value={$settings.convertMarkdown}
      {save} />
    <FontField
      label="Font"
      help=""
      bind:value={$settings.fontFamily}
      bind:size={$settings.fontSize}
      sample="The body of the story is displayed in this font."
      {save} />
    <NumberField
      label="Font size"
      help=""
      bind:value={$settings.fontSize}
      min={9}
      max={20}
      step={1}
      {save} />
    {#if $settings.convertMarkdown}
      <SampleField
        label="Dialog"
        help=""
        bind:value={$settings.dialogSettings}
        sample="&quot;This is how the lines will look like.&quot;"
        {save} />
      <SampleField
        label="Description"
        help=""
        bind:value={$settings.descriptionSettings}
        sample="A typical narrative will look like this."
        {save} />
      <SampleField
        label="User name"
        help=""
        bind:value={$settings.userNameSettings}
        sample="User name will look like this."
        {save} />
      <SampleField
        label="Char Name"
        help=""
        bind:value={$settings.charNameSettings}
        sample="Characters' names will look like this."
        {save} />
    {/if}
  </div>
</div>

<style>
  :global(.plain) {
    font-style: normal;
  }
</style>
