import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/api/fs'
import { openAiApiKey, openAiModel } from './store'
import { Configuration, OpenAIApi } from 'openai'
import type { SceneType, Story } from './interfaces'

const settingsPath = 'settings.json'
const promptsPath = 'prompts.json'

let apiKey = '';
let apiModel = '';

openAiApiKey.subscribe((key: string) => { apiKey = key });
openAiModel.subscribe((model: string) => { apiModel = model });

export async function loadSettings() {
  const settingsJson = await readTextFile(settingsPath, { dir: BaseDirectory.AppConfig })
  const settings = JSON.parse(settingsJson)
  openAiApiKey.set(settings.openAiApiKey)
  openAiModel.set(settings.openAiModel)
  const configuration = new Configuration({
    apiKey: settings.openAiApiKey
  })
  const openai = new OpenAIApi(configuration)
  const response = await openai.listModels()
  const models = response.data.data.map((model) => {
    return { value: model.id, name: model.id }
  })

  return models;
}

export async function saveSettings(prompts: SceneType[]) {
  const settings = {
    "openAiApiKey": apiKey,
    "openAiModel": apiModel
  }
  writeTextFile({ path: settingsPath, contents: JSON.stringify(settings) }, { dir: BaseDirectory.AppConfig })
  writeTextFile({ path: promptsPath, contents: JSON.stringify(prompts) }, { dir: BaseDirectory.AppConfig })
}

export async function saveStory(story: Story) {
  let fileName = story.title.replace(/[<>:"/\\|?*]/g, '_').trim();
  if (fileName === '') {
    fileName = 'story' + Date.now() + '.json'
  } else {
    fileName = fileName + '.json'
  }
  writeTextFile({ path: fileName, contents: JSON.stringify(story) }, { dir: BaseDirectory.AppData })
}