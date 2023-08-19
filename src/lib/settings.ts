import { story, settings, defaultSettings } from './store'
import { Api, type Settings, type Story } from './interfaces'
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
  if (!settings.generateImage) {
    settings.generateImage = defaultSettings.generateImage
  }
  if (!settings.sdURL) {
    settings.sdURL = defaultSettings.sdURL
  }
  if (!settings.imageWidth) {
    settings.imageWidth = defaultSettings.imageWidth
  }
  if (!settings.imageHeight) {
    settings.imageHeight = defaultSettings.imageHeight
  }
  if (!settings.steps) {
    settings.steps = defaultSettings.steps
  }
  if (!settings.cfgScale) {
    settings.cfgScale = defaultSettings.cfgScale
  }
  if (!settings.prompt) {
    settings.prompt = defaultSettings.prompt
  }
  if (!settings.negativePrompt) {
    settings.negativePrompt = defaultSettings.negativePrompt
  }
  if (!settings.sampler) {
    settings.sampler = defaultSettings.sampler
  }
  if (!settings.enableHires) {
    settings.enableHires = defaultSettings.enableHires
  }
  if (!settings.denoisingStrength) {
    settings.denoisingStrength = defaultSettings.denoisingStrength
  }
  if (!settings.hiresScale) {
    settings.hiresScale = defaultSettings.hiresScale
  }
  if (!settings.hiresUpscaler) {
    settings.hiresUpscaler = defaultSettings.hiresUpscaler
  }
  if (!settings.enableADetailer) {
    settings.enableADetailer = defaultSettings.enableADetailer
  }
  if (!settings.aiLang) {
    settings.aiLang = defaultSettings.aiLang
  }
  if (!settings.userLang) {
    settings.userLang = defaultSettings.userLang
  }
}

export async function loadSettings() {
  const settingsJson = await readTextFile(settingsPath, { dir: BaseDirectory.AppConfig })
  settings.set(JSON.parse(settingsJson))
  fixSettings(get(settings))
  if (currentStory.api === Api.OpenAi && currentStory.openAi.apiUrl && currentStory.openAi.apiUrl.startsWith('https://api.openai.com')) {
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
    // Open AI compatible API
    return [
      { value: "gpt-3.5-turbo", name: "gpt-3.5-turbo"},
      { value: "gpt-3.5-turbo-16k", name: "gpt-3.5-turbo-16k"},
      { value: "gpt-4", name: "gpt-4"},
      { value: "gpt-4-32k", name: "gpt-4-32k"}
    ]
  }
}

export async function saveSettings() {
  writeTextFile({ path: settingsPath, contents: JSON.stringify(currentSettings) }, { dir: BaseDirectory.AppConfig })
}