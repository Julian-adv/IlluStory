import { loadSettings } from '$lib/settings'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  return {
    models: await loadSettings()
  }
}
