import type { SceneType } from '$lib/interfaces';

export const roles = [
  { value: "system", name: "System" },
  { value: "assistant", name: "Assistant" },
  { value: "user", name: "User" },
  { value: 'set_char', name: 'Char setting' },
  { value: 'set_user', name: 'User setting' },
];

function generateMessages(scenes: SceneType[]) {
  return scenes.map((s) => ({ role: s.role, content: s.content }))
}

export async function sendChat(scenes: SceneType[], apiKey: string, model: string) {
  const uri = "https://api.openai.com/v1/chat/completions"
  const url = new URL(uri)
  const messages = generateMessages(scenes)
  const respFromGPT = await fetch(url, {
    body: JSON.stringify({
      frequency_penalty: 0.4,
      logit_bias: {},
      max_tokens: 500,
      messages: messages,
      model: model,
      presence_penalty: 0.4,
      stream: false,
      temperature: 0.75
    }),
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    method: "POST",
    signal: null
  })
  const dataFromGPT = await respFromGPT.json()
  console.log('dataFromGPT', dataFromGPT)
  if (respFromGPT.ok && respFromGPT.status >= 200 && respFromGPT.status < 300) {
    const gptScene: SceneType = dataFromGPT.choices[0].message
    gptScene.id = scenes.length
    return [...scenes, gptScene]
  } else {
    return scenes;
  }
}
