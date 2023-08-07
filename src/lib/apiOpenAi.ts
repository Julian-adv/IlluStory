import { get } from "svelte/store"
import type { Story, SceneType, Usage, Message } from "./interfaces"
import { openAiApiKey, zeroUsage } from "./store"
import { startStory } from "./api"

function generateMessages(story: Story, initScenes: SceneType[], addedScenes: SceneType[], summary: boolean, firstSceneIndex: number, sendStartIndex: number) {
  const messages: Message[] = []
  if (summary) {
    messages.push({ role: 'system', content: story.summarizePrompt })
    for (const scene of initScenes.slice(firstSceneIndex)) {
      messages.push({ role: scene.role, content: scene.content })
    }
  } else {
    for (const scene of initScenes) {
      if (scene.role !== startStory) {
        messages.push({ role: scene.role, content: scene.content })
      }
    }
  }

  for (const scene of addedScenes.slice(sendStartIndex)) {
    messages.push({ role: scene.role, content: scene.content })
  }
  return messages
}

export async function sendChatOpenAi(story: Story, initScenes: SceneType[], addedScenes: SceneType[], summary: boolean, firstSceneIndex: number, sendStartIndex: number): Promise<[SceneType|null, Usage]> {
  const uri = "https://api.openai.com/v1/chat/completions"
  // const uri = "http://localhost:8000/v1/chat/completions"
  const url = new URL(uri)
  const messages = generateMessages(story, initScenes, addedScenes, summary, firstSceneIndex, sendStartIndex)
  const respFromGPT = await fetch(url, {
    body: JSON.stringify({
      model: story.model,
      // model: "vicuna-13b-v1.5-16k",
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
    gptScene.id = 0
    return [gptScene, dataFromGPT.usage]
  } else {
    return [null, zeroUsage]
  }
}
