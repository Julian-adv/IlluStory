<script lang="ts">
  import { Editor, rootCtx, defaultValueCtx, editorViewOptionsCtx, config } from '@milkdown/core';
  import { listener, listenerCtx } from '@milkdown/plugin-listener';
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
        // Add attributes to the editor container
        ctx.update(editorViewOptionsCtx, (prev) => {
          const bg = readOnly ? '' : 'bg-neutral-300 border focus:ring-1 prompt'
          return {
            ...prev,
            attributes: { class: `p-1 font-serif text-sm antialiased leading-relaxed rounded-lg ${bg}`, spellcheck: 'false' },
            editable
          }
        })
      })
      .config((ctx) => {
        ctx.get(listenerCtx).focus(onFocus).mounted(onMount)
      })
      .use(commonmark)
      .use(listener)
      .create();
  }

  function onFocus() {
    markdownEditor.then((editor) => {
      if (!readOnly) {
        editor.action(replaceAll(''))
      }
    })
  }

  function onMount() {
    markdownEditor.then((editor) => {
      const text = markdown == '' ? '*Write a prompt.*' : markdown;
      editor.action(replaceAll(text))
    })
  }
</script>
  
<div use:makeEditor />

<style>
  :global(.milkdown p em) {
    color: rgb(82 82 82);
  }

  :global(.milkdown .prompt p em) {
    color: rgb(163 163 163);
  }
</style>