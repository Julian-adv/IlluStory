import { story, settings, defaultSettings } from './store'
import type { Settings, Story } from './interfaces'
import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/api/fs'
import { Configuration, OpenAIApi } from 'openai'
import { get } from 'svelte/store'

const settingsPath = 'settings.json'

let currentStory: Story
let currentSettings: Settings

story.subscribe(s => currentStory = s)
settings.subscribe(s => currentSettings = s)

function fixSettings(settings: Settings) {
  if (!settings.sortOrder) {
    settings.sortOrder = defaultSettings.sortOrder
  }
  if (!settings.sortType) {
    settings.sortType = defaultSettings.sortType
  }
  if (!settings.convertMarkdown) {
    settings.convertMarkdown = defaultSettings.convertMarkdown
  }
  if (!settings.dialogSettings) {
    settings.dialogSettings = defaultSettings.dialogSettings
  }
  if (!settings.descriptionSettings) {
    settings.descriptionSettings = defaultSettings.descriptionSettings
  }
  if (!settings.userNameSettings) {
    settings.userNameSettings = defaultSettings.userNameSettings
  }
  if (!settings.charNameSettings) {
    settings.charNameSettings = defaultSettings.charNameSettings
  }
  if (!settings.fontFamily) {
    settings.fontFamily = defaultSettings.fontFamily
  }
  if (!settings.fontSize) {
    settings.fontSize = defaultSettings.fontSize
  }
}

export async function loadSettings() {
  const settingsJson = await readTextFile(settingsPath, { dir: BaseDirectory.AppConfig })
  settings.set(JSON.parse(settingsJson))
  fixSettings(get(settings))
  if (currentStory.apiUrl && currentStory.apiUrl.startsWith('https://api.openai.com')) {
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