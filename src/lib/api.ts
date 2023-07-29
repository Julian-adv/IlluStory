import type { SceneType } from '$lib/interfaces';

export const charSetting = 'set_char';
export const userSetting = 'set_user';
export const startStory = 'start_story';

export const roles = [
  { value: "system", name: "System" },
  { value: "assistant", name: "Assistant" },
  { value: "user", name: "User" },
  { value: charSetting, name: 'Char setting' },
  { value: userSetting, name: 'User setting' },
  { value: startStory, name: "Start story" },
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
    gptScene.id = scenes[scenes.length - 1].id + 1;
    return [[...scenes, gptScene], dataFromGPT.usage];
  } else {
    return [scenes, dataFromGPT.usage];
  }
}
