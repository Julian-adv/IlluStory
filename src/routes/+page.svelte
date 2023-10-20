<script lang="ts">
  import { goto } from '$app/navigation'
  import { settingsFile } from '$lib/fs'
  import { command } from '$lib/store'
  import { tcExists, tcLog, tcPost, tcSetDataDir } from '$lib/tauriCompat'
  import { Command } from '@tauri-apps/api/shell'

  async function checkServer() {
    if (!$command) {
      try {
        const response = await tcPost('http://localhost:8000/api/fs/exists', {
          path: 'resources\\server\\start_server.bat'
        })
        tcLog('INFO', 'server exists:', JSON.stringify(response))
        console.log('server exists: ', response)
      } catch (error) {
        console.log('server error: ', error)
        $command = new Command('run-bat', ['/c', 'resources\\server\\start_server.bat'])
        const _child = await $command.spawn()
        $command.on('close', data => {
          console.log('server closed:', data)
        })
        $command.on('error', error => {
          console.log('server error:', error)
        })
        $command.stdout.on('data', data => {
          console.log('server stdout:', data)
        })
        $command.stderr.on('data', data => {
          console.log('server stderr:', data)
        })
        tcLog('INFO', 'server started')
        console.log('server started')
      }
    }
  }

  async function checkSettings() {
    await checkServer()
    await tcSetDataDir()
    if (!(await tcExists(settingsFile))) {
      goto('/settings')
    } else {
      goto('/play')
    }
  }

  checkSettings()
</script>
