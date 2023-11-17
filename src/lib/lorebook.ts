import type { Lorebook, Session } from './interfaces'
import { tcLog, tcReadTextFile } from './tauriCompat'

export async function loadLorebook(path: string): Promise<Lorebook> {
  const json = await tcReadTextFile(path)
  const lorebook = JSON.parse(json)
  return lorebook
}

export function initLorebook(lorebook: Lorebook, session: Session) {
  lorebook.rules.forEach(rule => {
    rule.triggered = false
  })
  session.lorebookTriggers.forEach(trigger => {
    trigger.triggered = false
  })
  tcLog('INFO', 'Lorebook initialized')
}
