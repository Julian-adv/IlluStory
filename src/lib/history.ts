import type { Settings } from "./interfaces"

export function pushHistory(settings: Settings, str: string) {
  settings.history.push(str)
  while (settings.history.length > settings.maxHistory) {
    settings.history.shift()
  }
}

export function getHistory(settings: Settings, index: number) {
  return settings.history[index]
}

export function getPrevHistory(settings: Settings, index: number): [string, number] {
  if (index > 0) {
    --index
    return [settings.history[index], index]
  } else {
    return ['', index]
  }
}

export function getNextHistory(settings: Settings, index: number): [string, number] {
  if (index < settings.history.length) {
    ++index
    return [settings.history[index], index]
  } else {
    return ['', index]
  }
}