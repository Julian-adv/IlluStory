import { settings, defaultSettings, inputHistory } from './store'
import type { Settings } from './interfaces'
import { get } from 'svelte/store'
import { settingsFile } from './fs'
import { tcCreateDir, tcExists, tcReadTextFile, tcSetDataDir, tcWriteTextFile } from './tauriCompat'
import { loadHistory } from './history'

let currentSettings: Settings

settings.subscribe(s => (currentSettings = s))

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
  if (!settings.sdURL) {
    settings.sdURL = defaultSettings.sdURL
  }
  if (!settings.imageSizes) {
    settings.imageSizes = defaultSettings.imageSizes
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
