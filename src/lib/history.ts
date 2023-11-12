import { tcReadTextFile, tcWriteTextFile } from './tauriCompat'

const maxHistory = 1000

export async function loadHistory() {
  try {
    const text = await tcReadTextFile('history.json')
    return JSON.parse(text)
  } catch (e) {
    return []
  }
}

export function pushHistory(history: string[], str: string) {
  history.push(str)
  while (history.length > maxHistory) {
    history.shift()
  }
  tcWriteTextFile('history.json', JSON.stringify(history, null, 2))
}

export function getHistory(history: string[], index: number) {
  return history[index]
}

export function getPrevHistory(history: string[], index: number): [string, number] {
  if (index > 0) {
    --index
  }
  return [history[index], index]
}

export function getNextHistory(history: string[], index: number): [string, number] {
  if (index < history.length) {
    ++index
  }
  if (index >= history.length) {
    return ['', history.length]
  } else {
    return [history[index], index]
  }
}
