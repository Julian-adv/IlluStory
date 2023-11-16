<script lang="ts">
  import { preset } from '$lib/store'
  import SelectField from './SelectField.svelte'
  import StringField from './StringField.svelte'
  import TextField from './TextField.svelte'

  export let mode = 'text'
  export let save = () => {}

  const visualizeModes = [
    { value: 'none', name: 'None' },
    { value: 'regexp', name: 'RegExp' },
    { value: 'text', name: 'Whole text' },
    { value: 'generate', name: 'Generate' }
  ]

  function help(mode: string) {
    switch (mode) {
      case 'none':
        return 'Do not generate image.'
      case 'regexp':
        return 'Generate image from the match of the regular expression.'
      case 'text':
        return 'Generate image from the whole text of the scene.'
      case 'generate':
        return 'Use the prompts below to generate the prompts needed to create the image.'
      default:
        return 'The prompt to use for visualizing the conversation.'
    }
  }
</script>

<SelectField
  label="Visualize mode"
  items={visualizeModes}
  bind:value={mode}
  help={help(mode)}
  {save} />
{#if mode === 'none'}
  <div></div>
{:else if mode === 'regexp'}
  <StringField label="" bind:value={$preset.visualizeRegexp} {save} />
{:else if mode === 'text'}
  <div></div>
{:else if mode === 'generate'}
  <TextField label="" bind:value={$preset.visualizePrompt} {save} />
{/if}
