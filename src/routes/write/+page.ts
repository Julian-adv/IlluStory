import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  const settings = await import('$lib/settings')
  return {
    models: await settings.loadSettings()
  }
}
