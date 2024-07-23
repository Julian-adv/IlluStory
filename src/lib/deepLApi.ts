import type { Settings } from './interfaces'
import { tcLog, tcPost } from './tauriCompat'

export async function translateText(
  settings: Settings,
  lang: string,
  text: string
): Promise<string> {
  const response = await tcPost(
    'https://api-free.deepl.com/v2/translate',
    {
      text: [text],
      target_lang: lang,
      tag_handling: 'xml'
    },
    {
      Authorization: 'DeepL-Auth-Key ' + settings.deeplApiKey,
      'Content-Type': 'application/json'
    }
  )
  if (response.ok) {
    tcLog('data from deepL', JSON.stringify(response.data))
    return response.data.translations[0].text
  } else {
    tcLog('ERROR', 'error from deepl', JSON.stringify(response))
    return text
  }
}
