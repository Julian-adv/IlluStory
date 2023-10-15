<script lang="ts">
  import { goto } from '$app/navigation'
  import { settingsFile } from '$lib/fs'
  import { tcExists, tcSetDataDir } from '$lib/tauriCompat'

  async function checkSettings() {
    await tcSetDataDir()
    if (!(await tcExists(settingsFile))) {
      goto('/settings')
    } else {
      goto('/play')
    }
  }

  checkSettings()
</script>
