<script lang="ts">
  import Markdown from "../Markdown.svelte";
  import { sendChat } from "$lib/api"
  import { openAiApiKey, openAiModel, scenes, usage } from "$lib/store";

  async function onEnter(markdown: string) {
    const trimmed = markdown.trim()
    const newScene = {
      id: $scenes.length,
      role: "user",
      content: trimmed
    }
    $scenes = [...$scenes, newScene];
    [$scenes, $usage] = await sendChat($scenes, $openAiApiKey, $openAiModel)
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div>
  <Markdown readOnly={false} onEnter={onEnter} />
</div>

<style lang="postcss">
  /* Disable some style from ProseMirror */
  :global(:focus-visible) {
    outline: 0px;
  }
</style>