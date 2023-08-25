import { get } from "svelte/store"
import type { Preset, SceneType, Usage, Message } from "./interfaces"
import { settings, zeroUsage } from "./store"
import { startStory, systemRole } from "./api"

function generateMessages(preset: Preset, initScenes: SceneType[], addedScenes: SceneType[], summary: boolean, firstSceneIndex: number, sendStartIndex: number) {
  const messages: Message[] = []
  if (summary) {
    messages.push({ role: systemRole, content: preset.summarizePrompt })
    for (const scene of initScenes.slice(firstSceneIndex)) {
      messages.push({ role: scene.role, content: scene.content })
    }
  } else {
    for (const scene of initScenes.slice(0, firstSceneIndex)) {
      if (scene.role !== startStory) {
        messages.push({ role: scene.role, content: scene.content })
      }
    }
    if (sendStartIndex === 0) {  // not summarized yet
      for (const scene of initScenes.slice(firstSceneIndex)) {
        messages.push({ role: scene.role, content: scene.content })
      }
    } 
  }

  for (const scene of addedScenes.slice(sendStartIndex)) {
    messages.push({ role: scene.role, content: scene.content })
  }
  return messages
}

export async function sendChatOpenAi(preset: Preset, initScenes: SceneType[], addedScenes: SceneType[], summary: boolean, firstSceneIndex: number, sendStartIndex: number): Promise<[SceneType|null, Usage]> {
  const uri = preset.openAi.apiUrl + '/chat/completions'
  // const uri = "https://api.openai.com/v1/chat/completions"
  // const uri = "http://localhost:8000/v1/chat/completions"
  const url = new URL(uri)
  const messages = generateMessages(preset, initScenes, addedScenes, summary, firstSceneIndex, sendStartIndex)
  // console.log('messages', messages)
  const respFromGPT = await fetch(url, {
    body: JSON.stringify({
      model: preset.openAi.model,
      // model: "vicuna-13b-v1.5-16k",
      temperature: preset.openAi.temperature.toFixed,
      frequency_penalty: preset.openAi.frequencyPenalty.toFixed,
      presence_penalty: preset.openAi.presencePenalty.toFixed,
      max_tokens: preset.openAi.maxTokens.toFixed,
      stream: false,
      messages: messages,
    }),
    headers: {
      "Authorization": "Bearer " + get(settings).openAiApiKey,
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: null
  })
  const dataFromGPT = await respFromGPT.json()
  console.log('dataFromGPT', dataFromGPT)
  if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
    const gptScene: SceneType = dataFromGPT.choices[0].message
    gptScene.id = 0
    return [gptScene, dataFromGPT.usage ?? zeroUsage]
  } else {
    return [null, zeroUsage]
  }
}
