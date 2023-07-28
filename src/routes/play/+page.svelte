<script lang="ts">
  import SceneList from './SceneList.svelte';
  import { Select } from 'flowbite-svelte';
  import { roles } from '$lib/api';
  import Input from './Input.svelte';
  import { onMount } from 'svelte';
  import { story, scenes, charName, userName } from '$lib/store';
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
      return { id: prompt.id, role: prompt.role, content: content };
    })
  }

  onMount(() => {
    $scenes = findNames($story.prompts);
    $scenes = replaceNames($scenes);
  })
</script>

<main>
  <SceneList />
  <div class='grid grid-cols-[8rem,1fr] gap-2 mt-2'>
    <div class='w-32 flex'>
      <Select items={roles} size="sm" class='text-sm self-start text-center w-full' bind:value={role} placeholder="Role" />
    </div>
    <div>
      <Input />
    </div>
  </div>
</main>
