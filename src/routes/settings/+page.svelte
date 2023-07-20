<script lang="ts">
  import { Label, Input } from 'flowbite-svelte'

  let apiKey = ''

  $: {
    console.log('apiKey', apiKey)
  }
</script>

<h1 class='text-lg font-semibold mb-1'>Settings</h1>
<div class='grid grid-cols-[8rem,1fr] gap-2'>
  <div class='w-32 flex'>
    <Label for='openAIKey' class='text-xs self-center text-right w-full'>Open AI API Key</Label>
  </div>
  <div class=''>
    <Input id='default-input' placeholder="sk-xxxxx" size='sm' bind:value={apiKey} />
  </div>
</div>
