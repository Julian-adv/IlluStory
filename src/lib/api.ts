import type { SceneType } from '$lib/interfaces';
// import { scenes, updateScenes } from './scene';
import { openAIKey } from './secrets';

function generateMessages(scenes: SceneType[]) {
  return scenes.map((s) => ({ role: s.role, content: s.content }))
}

export async function chat(scenes: SceneType[], userInput: string|null, updateScenes: (scene: SceneType) => void) {
  const uri = "https://api.openai.com/v1/chat/completions"
  const url = new URL(uri)
  let id = scenes.length
  if (userInput) {
    console.log('userInput', userInput)
    const newScene: SceneType = {
      id: id,
      role: "user",
      content: userInput
    }
    updateScenes(newScene)
    id++
  }
  const messages = generateMessages(scenes)
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
  const dataFromGPT = await respFromGPT.json()
  console.log('dataFromGPT', dataFromGPT)
  if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
    const gptScene: SceneType = dataFromGPT.choices[0].message
    gptScene.id = id
    updateScenes(gptScene)
  }
}
