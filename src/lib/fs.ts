import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/api/fs'
import { openAiApiKey, openAiModel } from './store'
import { Configuration, OpenAIApi } from 'openai'
import type { Story } from './interfaces'
import { open, save } from '@tauri-apps/api/dialog'

const settingsPath = 'settings.json'

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

export async function saveSettings() {
  const settings = {
    "openAiApiKey": apiKey,
    "openAiModel": apiModel
  }
  writeTextFile({ path: settingsPath, contents: JSON.stringify(settings) }, { dir: BaseDirectory.AppConfig })
}

export async function loadStory(): Promise<[Story|null, string]> {
  const selected = await open({ filters: [{ name: '*', extensions: ['json']}]});
  if (typeof(selected) === 'string' ) {
    const json = await readTextFile(selected);
    return [JSON.parse(json) as Story, selected];
  }
  return [null, ''];
}

export async function saveStory(story: Story) {
  let fileName = story.title.replace(/[<>:"/\\|?*]/g, '_').trim();
  if (fileName === '') {
    fileName = 'story' + Date.now() + '.json'
  } else {
    fileName = fileName + '.json'
  }
  const filePath = await save({ defaultPath: fileName, filters: [{ name: '*', extensions: ['json'] }] })
  if (filePath) {
    writeTextFile(filePath, JSON.stringify(story))
  }
  return filePath;
}

export async function saveStoryQuietly(filePath:string, story:Story) {
  writeTextFile(filePath, JSON.stringify(story))
}