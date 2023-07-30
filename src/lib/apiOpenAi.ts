import { get } from "svelte/store"
import type { Story, SceneType } from "./interfaces"
import { openAiApiKey } from "./store"
import { newSceneId } from "$lib"

function generateMessages(scenes: SceneType[]) {
  return scenes.map((s) => ({ role: s.role, content: s.content }))
}

export async function sendChatOpenAi(story: Story, scenes: SceneType[]) {
  const uri = "https://api.openai.com/v1/chat/completions"
  const url = new URL(uri)
  const messages = generateMessages(scenes)
  const respFromGPT = await fetch(url, {
    body: JSON.stringify({
      model: story.model,
      temperature: story.temperature.toFixed,
      frequency_penalty: story.frequencyPenalty.toFixed,
      presence_penalty: story.presencePenalty.toFixed,
      max_tokens: story.maxTokens.toFixed,
      stream: false,
      messages: messages,
    }),
    headers: {
      "Authorization": "Bearer " + get(openAiApiKey),
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: null
  })
  const dataFromGPT = await respFromGPT.json()
  console.log('dataFromGPT', dataFromGPT)
  if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
    const gptScene: SceneType = dataFromGPT.choices[0].message
    gptScene.id = newSceneId(scenes);
    return [[...scenes, gptScene], dataFromGPT.usage];
  } else {
    return [scenes, dataFromGPT.usage];
  }
}
