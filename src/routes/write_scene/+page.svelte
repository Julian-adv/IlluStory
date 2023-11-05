<script lang="ts">
  import { Button, Checkbox } from 'flowbite-svelte'
  import StringField from '../common/StringField.svelte'
  import ImageField from '../common/ImageField.svelte'
  import DropSelect from '../common/DropSelect.svelte'
  import { curScene, curScenePath, settings, fileDialog } from '$lib/store'
  import { assistantRole, chatRoles, countTokensApi, systemRole } from '$lib/api'
  import FlexibleTextarea from '../common/FlexibleTextarea.svelte'
  import { decodeBase64, getUniqueId } from '$lib'
  import { tick } from 'svelte'
  import { saveObjQuietly } from '$lib/fs'
  import { generateImage } from '$lib/imageApi'
  import { loadSceneDialog, saveScene } from '$lib/scene'
  import { loadMetaDataDialog } from '$lib/charSettings'
  import FileDialog from '$lib/FileDialog.svelte'
  import DragAndDropList from '../common/DragAndDropList.svelte'

  let autoSave = true
  let totalTokens = 0
  const width = 1024
  const height = 512

  async function load() {
    const [tempScene, path] = await loadSceneDialog()
    if (tempScene) {
      $curScene = tempScene
      $curScenePath = path
      totalTokens = 0
    }
  }

  async function importScene() {
    const metadata = await loadMetaDataDialog()
    if (metadata) {
      const charStr = decodeBase64(metadata.tEXt.chara)
      const char = JSON.parse(charStr)
      if (char.spec === 'chara_card_v2') {
        $curScene.scenes.push({
          id: $curScene.scenes.length,
          role: assistantRole,
          content: char.data.first_mes
        })
        $curScene = $curScene
        totalTokens = 0
      }
    }
  }

  async function save() {
    const tempFilePath = await saveScene($curScene)
    if (tempFilePath) {
      $curScenePath = tempFilePath
    }
  }

  function autoSaveFunc() {
    if (autoSave && $curScenePath) {
      saveObjQuietly($curScenePath, $curScene)
    }
  }

  async function regenerateImage() {
    $curScene.image = await generateImage($settings, width, height, $curScene.scenes[0].content)
    autoSaveFunc()
  }

  function countTokens(str: string) {
    if (str) {
      const tokens = countTokensApi(str)
      totalTokens += tokens
      return tokens
    }
    return 0
  }

  async function addScene() {
    await tick()
    $curScene.scenes = [
      ...$curScene.scenes,
      { id: $curScene.scenes.length, role: systemRole, content: '' }
    ]
  }
</script>

<div class="px-4">
  <input type="file" id="fileInput" class="hidden" />
  <h1 class="text-lg font-semibold mb-1">Scene Editing</h1>
  <FileDialog
    bind:openDialog={$fileDialog.open}
    bind:ext={$fileDialog.ext}
    bind:value={$fileDialog.value}
    bind:title={$fileDialog.title} />
  <div class="mt-2 mb-5 flex gap-2">
    <Button color="alternative" size="sm" on:click={load}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
      </svg>
      <span class="pl-2">Load</span>
    </Button>
    <Button color="alternative" size="sm" on:click={importScene}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
      </svg>
      <span class="pl-2">Import</span>
    </Button>
    <Button color="alternative" size="sm" on:click={save}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5 text-gray-400">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <span class="pl-2">Save as ...</span>
    </Button>
    <Checkbox class="inline self-center" bind:checked={autoSave}>Auto save</Checkbox>
  </div>
  <div class="grid grid-cols-[9rem,5rem,1fr] gap-0">
    <StringField label="File path" size="sm" bind:value={$curScenePath} disabled />
    <ImageField label="Image" bind:value={$curScene.image} {width} {height} save={autoSaveFunc} />
    <Button
      color="alternative"
      class="col-start-2 col-span-2 w-10 h-10 p-0 bg-stone-100 z-20 text-stone-200 border-stone-100 focus:ring-0"
      pill
      on:click={regenerateImage}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    </Button>
    <StringField label="Title" bind:value={$curScene.title} save={autoSaveFunc} />
  </div>

  <h1 class="text-lg font-semibold mb-1 mt-3">Prompts</h1>
  <DragAndDropList
    bind:items={$curScene.scenes}
    itemClass="grid grid-cols-[9rem,1fr] gap-2"
    onChange={autoSaveFunc}
    removesItems
    let:item={scene}
    let:i>
    <div class=" w-36 flex">
      <DropSelect
        items={chatRoles}
        size="sm"
        classStr="text-sm self-start text-center w-full"
        bind:value={$curScene.scenes[i].role}
        save={autoSaveFunc} />
    </div>
    <div class="flex items-center w-full text-center">
      <div class="flex flex-col w-full text-left">
        <FlexibleTextarea
          id={getUniqueId()}
          placeholder="Write your prompt"
          bind:value={$curScene.scenes[i].content}
          on:blur={autoSaveFunc} />
        <span class="text-sm text-stone-400 px-2">Tokens: {countTokens(scene.content)}</span>
      </div>
    </div>
  </DragAndDropList>
  <div class="text-base text-stone-500 p-3">Total tokens: {totalTokens}</div>
  <Button size="xs" color="alternative" on:click={addScene}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  </Button>
</div>
