<script lang="ts">
  import Markdown from "./Markdown.svelte";
</script>

<div class='mt-5'>
  <Markdown readOnly={false} />
</div>

<style lang="postcss">
  :global(:focus-visible) {
    outline: 0px;
  }
</style>