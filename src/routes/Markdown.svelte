<script lang="ts">
  import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx } from '@milkdown/core';
  import { commonmark } from '@milkdown/preset-commonmark';
  import { nord } from '@milkdown/theme-nord';
  import { replaceAll } from '@milkdown/utils';
  // import 'prosemirror-view/style/prosemirror.css'

  export let markdown = '';
  export let readOnly = true;
  let markdownEditor: Promise<Editor>;
  const editable = () => !readOnly;

  function makeEditor(dom: HTMLDivElement) {
    // to obtain the editor instance we need to store a reference of the editor.
    markdownEditor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, dom);
      })
      .config(nord)
      .config((ctx) => {
        ctx.set(defaultValueCtx, "*Write your response here.*")
      })
      .config((ctx) => {
        // Add attributes to the editor container
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          attributes: { spellcheck: 'false' },
          editable
        }))
      })
      .use(commonmark)
      .create();
  }

  $: {
    if (markdownEditor) {
      markdownEditor.then((editor) => {
        editor.action(replaceAll(markdown))
      })
    }
  }
</script>
  
<div use:makeEditor />

<style>
  :global(.milkdown p) {
    margin-block-start: 0px;
    font-size: 11pt;
    font-family: 'Times New Roman', 'Noto Serif KR', Times, serif
  }
</style>