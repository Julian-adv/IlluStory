<script lang="ts">
  import '@milkdown/theme-nord/style.css';
  import SceneList from './SceneList.svelte';
  import Input from './Input.svelte';
  import { Button } from 'flowbite-svelte';
  import { hiddenScenes, scenes } from '$lib/store';
  import { onMount } from 'svelte';
  import { loadSettings } from '$lib/fs';
  import type { SceneType } from '$lib/interfaces';
  import { Select } from 'flowbite-svelte';

  let char = 'Abby';
  let user = 'Julian';

  let roles = [
    { value: "system", name: "System" },
    { value: "assistant", name: "Assistant" },
    { value: "user", name: "User" },
  ]

  let role = '';

  let initialScenes = [
//     {
//       id: 0,
//       role: 'system',
//       content: `Write a response of ${char} according to the following rules.
// 1. Do not write the ${user}'s emotion, thoughts, and dialogues. Stop generating text and wait inputs from ${user} for those.
// 2. The user is ${user}, and AI is ${char}. Your task is to role-play as that character in the given situation, taking into account that the situation will continue. React appropriately in the conversation.
// 3. Use English with an ability to engage in detailed and natural conversations on complex subjects.
// 4. Write with a suitable mix of dialogue, explanation, and description.
// 5. You are a helpful assistant that communicates using Markdown. Enclose dialogues in quotation marks (\") and wrap all other descriptions in asterisks (\*).
// 6. The response should not exceed 3 paragraphs.
// 7. Attach a graphical description of the current scene to each response. This should encompass ${char}'s appearance, attire, posture, and the surrounding environment. The description should be a series of brief phrases enclosed in double brackets [[]].

//   Here is the prewritten beginning part of the story. Use it as an example:`
//     },
    {
      id: 0,
      role: 'assistant',
      content: `*Under a rain-soaked night sky, a girl named ${char} stands alone, sheltered by the grand shadow of ${user}'s luxurious mansion.
Her school uniform, drenched from the relentless downpour, clings tightly to her form.
Returning home from an evening appointment, ${user} spots the solitary figure.
His gaze lands on ${char}, taking in her forlorn appearance.
${char} senses his presence and lifts her gaze to meet his.
She swallows hard, her voice barely above a whisper as she asks her question.*
[[rain,night,a girl,standing,luxurious mansion,drenched school uniform]]`
    },
    {
      id: 1,
      role: 'assistant',
      content: `${char}: **"Could...could I possibly stay here tonight? Please."**
*She implores, desperation evident in her eyes.*
${char}: **"I have nowhere else to go."**
[[rain,night,a girl,standing,luxurious mansion,drenched school uniform,implores,desperation]]`
    }
  ]

  async function roll() {
    // scenes[scenes.length - 1].image = await generateImage('1girl')
  }

  function sendChat() {

  }

  onMount(async () => {
    let [models, prompts] = await loadSettings();
    let tempScenes = [...prompts, ...initialScenes];
    $hiddenScenes = prompts.length;
    let id = 0;
    tempScenes.forEach((scene: SceneType) => {
      scene.id = id++;
    });
    $scenes = tempScenes
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
  
  <div class='mt-5'>
    <Button on:click={roll} size="sm" color="alternative">Reimage</Button>
    <Button on:click={sendChat} size="sm">Continue</Button>
  </div>
</main>
