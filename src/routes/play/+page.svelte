<script lang="ts">
  import SceneList from './SceneList.svelte';
  import { Select } from 'flowbite-svelte';
  import { roles } from '$lib/api';
  import Input from './Input.svelte';
  import { onMount } from 'svelte';
  import { story, scenes } from '$lib/store';

  let role = 'user';

  onMount(async () => {
    $scenes = $story.prompts
    console.log('scenes', $scenes)
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
