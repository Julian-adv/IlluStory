import { story, settings } from './store'
import type { Settings, Story } from './interfaces'
import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/api/fs'
import { Configuration, OpenAIApi } from 'openai'
import { get } from 'svelte/store'

const settingsPath = 'settings.json'

let currentStory: Story
let currentSettings: Settings

story.subscribe(s => currentStory = s)
settings.subscribe(s => currentSettings = s)

export async function loadSettings() {
  if (currentStory.apiUrl && currentStory.apiUrl.startsWith('https://api.openai.com')) {
    const settingsJson = await readTextFile(settingsPath, { dir: BaseDirectory.AppConfig })
    settings.set(JSON.parse(settingsJson))
    const configuration = new Configuration({
      apiKey: get(settings).openAiApiKey
    })
    const openai = new OpenAIApi(configuration)
    const response = await openai.listModels()
    const models = response.data.data.map(model => {
      return { value: model.id, name: model.id }
    })

    return models
  } else {
    // console.log('url', tempStory.apiUrl)
    // const url = new URL(tempStory.apiUrl + '/models')
    // const respFromGPT = await fetch(url, {
    //   body: "",
    //   headers: {},
    //   method: "POST",
    //   signal: null
    // })
    // const dataFromGPT = await respFromGPT.json()
    // console.log('dataFromGPT', dataFromGPT)
    return [
      { value: "gpt-4", name: "gpt-4"},
      { value: "gpt-4-32k", name: "gpt-4-32k"}
    ]
  }
}

export async function saveSettings() {
  writeTextFile({ path: settingsPath, contents: JSON.stringify(currentSettings) }, { dir: BaseDirectory.AppConfig })
}