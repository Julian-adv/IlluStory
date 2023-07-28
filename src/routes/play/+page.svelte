<script lang="ts">
  import SceneList from './SceneList.svelte';
  import { Button, Select } from 'flowbite-svelte';
  import { roles } from '$lib/api';
  import Input from './Input.svelte';
  import { onMount } from 'svelte';
  import { story, scenes, charName, userName, usage, storyPath, sessionPath } from '$lib/store';
  import { savePath } from '$lib/fs';
  import type { Prompt } from '$lib/interfaces';

  let role = 'user';

  function findNames(prompts: Prompt[]) {
    return prompts.map((prompt) => {
      let role = prompt.role
      if (prompt.role === 'set_char') {
        const match = prompt.content.match(/Name: *(.+)/)
        if (match) {
          $charName = match[1];
        }
        role = 'system';
      } else if (prompt.role === 'set_user') {
        const match = prompt.content.match(/Name: *(.+)/)
        if (match) {
          $userName = match[1];
        }
        role = 'system';
      }
      return { id: prompt.id, role: role, content: prompt.content };
    })
  }

  function replaceNames(prompts: Prompt[]) {
    return prompts.map((prompt) => {
      let content = prompt.content.replace(/{{char}}/g, $charName)
      content = content.replace(/{{user}}/g, $userName)
      content = content.replace(/<char>/g, $charName)
      content = content.replace(/<user>/g, $userName)
      return { id: prompt.id, role: prompt.role, content: content };
    })
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const sec = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day}_${hour}-${min}-${sec}`;
  }

  function insertTimestamp(filename: string): string {
    let extensionIndex = filename.lastIndexOf(".json");
    if (extensionIndex === -1) {
      extensionIndex = filename.length;
    }

    const baseName = filename.slice(0, extensionIndex);
    const extension = filename.slice(extensionIndex);
    const timestamp = formatDate(new Date());

    return `${baseName}_${timestamp}${extension}`;
  }

  async function save() {
    const tempPath = await savePath(insertTimestamp($storyPath), $scenes);
    if (tempPath) {
      $sessionPath = tempPath;
    }
  }

  function newSession() {
    $scenes = findNames($story.prompts);
    $scenes = replaceNames($scenes);
  }

  onMount(() => {
    newSession();
  })
</script>

<main>
  <SceneList />
  <div class='grid grid-cols-[8rem,1fr] gap-2 mt-2'>
    <div class='col-span-2 text-sm text-stone-400'>
      Prompt tokens: {$usage.prompt_tokens}, Completion tokens: {$usage.completion_tokens}, Total tokens: {$usage.total_tokens}
    </div>
    <div class='col-span-2 text-sm text-stone-400'>
      <Button color='alternative' size='sm' on:click={newSession}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        New session
      </Button>
      {#if $sessionPath}
        Saved {$sessionPath}
      {:else}
        <Button color='alternative' size='sm' on:click={save}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          Save as ...
        </Button>
      {/if}
    </div>
    <div class='w-32 flex'>
      <Select items={roles} size="sm" class='text-sm self-start text-center w-full' bind:value={role} placeholder="Role" />
    </div>
    <div>
      <Input />
    </div>
  </div>
</main>
