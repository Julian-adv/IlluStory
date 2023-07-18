<script lang="ts">
  import '@milkdown/theme-nord/style.css';
  import Scene from './Scene.svelte';
  import type { SceneType } from '$lib/interfaces';
  import { openAIKey } from '$lib/secrets';

  let char = 'Abby';
  let user = 'Julian';
  let scenes: SceneType[] = [
    {
      id: 0,
      role: 'system',
      content: `Write a response of ${char} according to the following rules.
1. Do not write the ${user}'s emotion, thoughts, and dialogues. Stop generating text and wait inputs from ${user} for those.
2. The user is ${user}, and AI is ${char}. Your task is to role-play as that character in the given situation, taking into account that the situation will continue. React appropriately in the conversation.
3. Use English with an ability to engage in detailed and natural conversations on complex subjects.
4. Write with a suitable mix of dialogue, explanation, and description.
5. You are a helpful assistant that communicates using Markdown. Enclose dialogues in quotation marks (\") and wrap all other descriptions in asterisks (\*).
6. The response should not exceed 3 paragraphs.
7. Attach a graphical description of the current scene to each response. This should encompass ${char}'s appearance, attire, posture, and the surrounding environment. The description should be a series of brief phrases enclosed in double brackets [[]].

Here is the prewritten beginning part of the story. Use it as an example:`
    },
    {
      id: 1,
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
      id: 2,
      role: 'assistant',
      content: `${char}: **"Could...could I possibly stay here tonight? Please."**
*She implores, desperation evident in her eyes.*
${char}: **"I have nowhere else to go."**
[[rain,night,a girl,standing,luxurious mansion,drenched school uniform,implores,desperation]]`
    }
  ]

  async function roll() {
    scenes[scenes.length - 1].image = await generateImage('1girl')
  }

  function generateMessages(scenes: Scene[]) {
    return scenes.map((s) => ({ role: s.role, content: s.content }))
  }

  async function chat() {
    const uri = "https://api.openai.com/v1/chat/completions"
    const url = new URL(uri)
    console.log('uri', uri, 'url', url)
    console.log('scenes', scenes)
    const messages = generateMessages(scenes)
    console.log('messages', messages)
    const respFromGPT = await fetch(url, {
      body: JSON.stringify({
        frequency_penalty: 0.4,
        logit_bias: {},
        max_tokens: 500,
        messages: messages,
        model: 'gpt-3.5-turbo-16k',
        presence_penalty: 0.4,
        stream: false,
        temperature: 0.75
      }),
      headers: {
        "Authorization": "Bearer " + openAIKey,
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: null
    })
    console.log('response from GPT', respFromGPT)
    const dataFromGPT = await respFromGPT.json()
    console.log('dataFromGPT', dataFromGPT)
    if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
      const gptScene: SceneType = dataFromGPT.choices[0].message
      gptScene.id = scenes[scenes.length - 1].id + 1
      scenes = [...scenes, gptScene]
    }
    
  }
</script>

<main>
  <h1>AI 친구</h1>
  {#each scenes as scene (scene.id)}
    <Scene {scene}/>
  {/each}
  
  <div class='buttons'>
    <button on:click={roll}>
      교환
    </button>
    <button on:click={chat}>
      대화
    </button>
  </div>
</main>

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.gray.100);
  }
</style>