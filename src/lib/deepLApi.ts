import type { Settings } from "./interfaces"
import { Body, getClient } from "@tauri-apps/api/http"

export async function translateText(settings: Settings, lang: string, text: string): Promise<string> {
  const client = await getClient()
  const response = await client.post('https://api-free.deepl.com/v2/translate',
    Body.json({
      "text": [text],
      "target_lang": lang,
      "tag_handling": "xml"
    }), {
    headers: {
      "Authorization": "DeepL-Auth-Key " + settings.deeplApiKey,
      "Content-Type": "application/json"
    }
  })
  if (response.ok) {
    return response.data.translations[0].text
  } else {
    console.log('response from deepl', response)
    return text
  }
}