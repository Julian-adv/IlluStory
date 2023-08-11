<script lang="ts">
  import { onMount } from 'svelte'
  import { settings } from '$lib/store'
  import { loadSettings, saveSettings } from '$lib/settings'
  import StringField from '../common/StringField.svelte'
  import CheckField from '../common/CheckField.svelte'
  import SampleField from '../common/SampleField.svelte'
  import FontField from '../common/FontField.svelte'

  onMount(async () => {
    await loadSettings()
  })

  function save() {
    saveSettings()
  }
</script>

<h1 class='text-lg font-semibold mb-1'>Settings</h1>
<div class='grid grid-cols-[9rem,5rem,1fr] gap-0'>
  <StringField label='Open AI API Key' placeholder='sk-xxxxx' help='Open AI API key.' bind:value={$settings.openAiApiKey} save={save} />
  <CheckField label='Convert to Markdown' help="Convert the AI's output to markdown." bind:value={$settings.convertMarkdown} save={save} />
  <FontField label='Font' help="" bind:value={$settings.fontFamily} sample='The body of the story is displayed in this font.' save={save} />
  {#if $settings.convertMarkdown}
    <SampleField label='Dialog' help="" bind:value={$settings.dialogSettings} sample='"This is how the lines will look like."' save={save} />
    <SampleField label='Description' help="" bind:value={$settings.descriptionSettings} sample='A typical narrative will look like this.' save={save} />
    <SampleField label='User name' help="" bind:value={$settings.userNameSettings} sample="User name will look like this." save={save} />
    <SampleField label='Char Name' help="" bind:value={$settings.charNameSettings} sample="Characters' names will look like this." save={save} />
  {/if}
</div>
