import { BaseDirectory, readTextFile, writeTextFile, readBinaryFile } from '@tauri-apps/api/fs'
import { openAiApiKey, openAiModel } from './store'
import { Configuration, OpenAIApi } from 'openai'
import type { Story } from './interfaces'
import { open, save } from '@tauri-apps/api/dialog'
import { convertFileSrc } from '@tauri-apps/api/tauri'

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
  const response = await openai.listModels();
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

async function readAsDataURL(blob:Blob): Promise<string|null> {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  })
}

export async function loadImage():Promise<string|null> {
  const selected = await open({ filters: [{ name: '*', extensions: ['png', 'jpg']}]});
  if (typeof(selected) === 'string') {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = () => resolve(readAsDataURL(xhr.response));
      xhr.onerror = reject;
      xhr.open('GET', convertFileSrc(selected));
      xhr.send();
    })
  }
  return null;
}

export async function savePath(path:string, data:any) {
  const filePath = await save({ defaultPath: path, filters: [{ name: '*', extensions: ['json'] }] })
  if (filePath) {
    writeTextFile(filePath, JSON.stringify(data, null, 2));
  }
  return filePath;
}

export async function saveStory(story: Story) {
  let fileName = story.title.replace(/[<>:"/\\|?*]/g, '_').trim();
  if (fileName === '') {
    fileName = 'story' + Date.now() + '.json'
  } else {
    fileName = fileName + '.json'
  }
  return savePath(fileName, story);
}

export async function saveStoryQuietly(filePath:string, story:Story) {
  writeTextFile(filePath, JSON.stringify(story, null, 2));
}