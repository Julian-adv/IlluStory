import { settings, defaultSettings, inputHistory } from './store'
import { ImageGeneration, type Settings } from './interfaces'
import { get } from 'svelte/store'
import { settingsFile } from './fs'
import { tcCreateDir, tcExists, tcReadTextFile, tcSetDataDir, tcWriteTextFile } from './tauriCompat'
import { loadHistory } from './history'

let currentSettings: Settings

settings.subscribe(s => (currentSettings = s))

function fixSettings(settings: Settings) {
  if (!settings.dataDir) {
    tcSetDataDir()
  }
  if (settings.sortOrder === undefined) {
    settings.sortOrder = defaultSettings.sortOrder
  }
  if (settings.sortType === undefined) {
    settings.sortType = defaultSettings.sortType
  }
  if (settings.dialogSettings === undefined) {
    settings.dialogSettings = defaultSettings.dialogSettings
  }
  if (settings.descriptionSettings === undefined) {
    settings.descriptionSettings = defaultSettings.descriptionSettings
  }
  if (settings.userNameSettings === undefined) {
    settings.userNameSettings = defaultSettings.userNameSettings
  }
  if (settings.charNameSettings === undefined) {
    settings.charNameSettings = defaultSettings.charNameSettings
  }
  if (!settings.fontFamily) {
    settings.fontFamily = defaultSettings.fontFamily
  }
  if (settings.fontSize === undefined) {
    settings.fontSize = defaultSettings.fontSize
  }
  if (!settings.sdURL) {
    if (settings.imageGeneration === ImageGeneration.ComfyUI) {
      settings.sdURL = 'localhost:8188'
    } else {
      settings.sdURL = defaultSettings.sdURL
    }
  }
  if (!settings.imageSizes) {
    if (settings.imageGeneration === ImageGeneration.ComfyUI) {
      settings.imageSizes = '832x1152, 1152x832, 1408x704'
    } else {
      settings.imageSizes = defaultSettings.imageSizes
    }
  }
  if (settings.steps === undefined) {
    settings.steps = defaultSettings.steps
  }
  if (settings.cfgScale === undefined) {
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
  if (settings.enableHires === undefined) {
    settings.enableHires = defaultSettings.enableHires
  }
  if (settings.denoisingStrength === undefined) {
    settings.denoisingStrength = defaultSettings.denoisingStrength
  }
  if (settings.hiresScale === undefined) {
    settings.hiresScale = defaultSettings.hiresScale
  }
  if (settings.hiresUpscaler === undefined) {
    settings.hiresUpscaler = defaultSettings.hiresUpscaler
  }
  if (settings.enableADetailer === undefined) {
    settings.enableADetailer = defaultSettings.enableADetailer
  }
  if (settings.ipWeight === undefined) {
    settings.ipWeight = defaultSettings.ipWeight
  }
  if (!settings.aiLang) {
    settings.aiLang = defaultSettings.aiLang
  }
  if (!settings.userLang) {
    settings.userLang = defaultSettings.userLang
  }
}

export async function loadSettings() {
  await tcSetDataDir()
  const text = await tcReadTextFile(settingsFile)
  if (!text) {
    return []
  }
  settings.set(JSON.parse(text))
  fixSettings(get(settings))

  inputHistory.set(await loadHistory())
}

export async function saveSettings() {
  if (!(await tcExists(settingsFile))) {
    tcCreateDir('')
  }
  tcWriteTextFile(settingsFile, JSON.stringify(currentSettings))
}
