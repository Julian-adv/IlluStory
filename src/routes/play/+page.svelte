<script lang="ts">
  import SceneList from './SceneList.svelte';
  import { Button, Select } from 'flowbite-svelte';
  import { charSetting, roles, startStory, userSetting, sendChat } from '$lib/api';
  import Input from './Input.svelte';
  import { onMount } from 'svelte';
  import { story, initialScenes, additionalScenes, charName, userName, usage, storyPath, sessionPath, startStoryId, zeroUsage } from '$lib/store';
  import { savePath } from '$lib/fs';
  import type { SceneType } from '$lib/interfaces';

  let role = 'user';
  let userInput = '';

  function findStartStory(prompts: SceneType[]) {
    return prompts.filter((prompt) => {
      if (prompt.role === startStory) {
        $startStoryId = prompt.id + 1;
        return false;
      }
      return true;
    })
  }

  function mergeScenes(oldScenes: SceneType[], oldStartId: number, newScenes: SceneType[], newStartId: number) {
    if (newScenes.length != oldScenes.length || oldStartId != newStartId) {
      // big change, refresh all images
      return newScenes;
    }
    let scenes = [];
    for (let i = 0; i < newScenes.length; i++) {
      let scene = newScenes[i];
      if (newScenes[i].id >= newStartId) {
        scene.image = oldScenes[i].image;
      }
      scenes.push(scene)
    }
    return scenes;
  }

  function findNames(prompts: SceneType[]) {
    return prompts.map((prompt) => {
      let role = prompt.role
      if (prompt.role === charSetting) {
        const match = prompt.content.match(/Name: *(.+)/)
        if (match) {
          $charName = match[1];
        }
        role = 'system';
      } else if (prompt.role === userSetting) {
        const match = prompt.content.match(/Name: *(.+)/)
        if (match) {
          $userName = match[1];
        }
        role = 'system';
      }
      return { id: prompt.id, role: role, content: prompt.content, image: prompt.image };
    })
  }

  function replaceNames(prompts: SceneType[]) {
    return prompts.map((prompt) => {
      let content = prompt.content.replace(/{{char}}/g, $charName)
      content = content.replace(/{{user}}/g, $userName)
      content = content.replace(/<char>/g, $charName)
      content = content.replace(/<user>/g, $userName)
      return { id: prompt.id, role: prompt.role, content: content, image: prompt.image };
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
    const tempPath = await savePath(insertTimestamp($storyPath), $additionalScenes);
    if (tempPath) {
      $sessionPath = tempPath;
    }
  }

  function updateInitialScenes() {
    const oldStartId = $startStoryId;
    let newScenes = findStartStory($story.prompts);
    $initialScenes = mergeScenes($initialScenes, oldStartId, newScenes, $startStoryId);
    $initialScenes = findNames($initialScenes);
    $initialScenes = replaceNames($initialScenes);
  }

  function newSession() {
    updateInitialScenes();
    $additionalScenes = [];
    $usage = zeroUsage;
    $sessionPath = '';
    userInput = '';
  }

  async function regenerate() {
    if ($additionalScenes.length == 0) {
      return;
    }
    $additionalScenes.pop();
    const scene = $additionalScenes.pop();
    if (scene) {
      const userNameLabel = $userName + ": "
      userInput = scene.content.startsWith(userNameLabel) ? scene.content.slice(userNameLabel.length) : scene.content;
    }
    $additionalScenes = $additionalScenes;
  }

  onMount(() => {
    if ($additionalScenes.length == 0) {
      newSession();
    } else {
      updateInitialScenes();
    }
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span class='pl-2'>New session</span>
      </Button>
      {#if $sessionPath}
        Saved {$sessionPath}
      {:else}
        <Button color='alternative' size='sm' on:click={save}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <span class='pl-2'>Save as ...</span>
        </Button>
      {/if}
      <Button color='alternative' size='sm' on:click={regenerate}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
        <span class='pl-2'>Back</span>
      </Button>
    </div>
    <div class='w-32 flex'>
      <Select items={roles} size="sm" class='text-sm self-start text-center w-full' bind:value={role} placeholder="Role" />
    </div>
    <div>
      <Input {role} bind:value={userInput} />
    </div>
  </div>
</main>
