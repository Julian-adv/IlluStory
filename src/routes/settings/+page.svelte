<script lang="ts">
  import { onMount } from 'svelte'
  import { convertMarkdown, openAiApiKey } from '$lib/store'
  import { loadSettings, saveSettings } from '$lib/fs'
  import StringField from '../common/StringField.svelte'
  import CheckField from '../common/CheckField.svelte'

  onMount(async () => {
    await loadSettings()
  })

  function save() {
    saveSettings()
  }
</script>

<h1 class='text-lg font-semibold mb-1'>Settings</h1>
<div class='grid grid-cols-[9rem,5rem,1fr] gap-0'>
  <StringField label='Open AI API Key' placeholder='sk-xxxxx' help='Open AI API key.' bind:value={$openAiApiKey} save={save} />
  <CheckField label='Convert to Markdown' help='Decorate output of LLMs into markdown.' bind:value={$convertMarkdown} save={save} />
</div>
