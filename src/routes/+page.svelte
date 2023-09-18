<script lang="ts">
  import { goto } from '$app/navigation'
  import { settingsFile } from '$lib/fs'
  import { BaseDirectory, exists } from '@tauri-apps/api/fs'

  async function checkSettings() {
    if (!(await exists(settingsFile, { dir: BaseDirectory.AppConfig }))) {
      goto('/settings')
    } else {
      goto('/play')
    }
  }

  checkSettings()
</script>
