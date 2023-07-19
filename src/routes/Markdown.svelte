<script lang="ts">
  import { Editor, rootCtx, editorViewOptionsCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
  import type { Ctx } from '@milkdown/ctx';
  import { listener, listenerCtx } from '@milkdown/plugin-listener';
  import { commonmark } from '@milkdown/preset-commonmark';
  import { nord } from '@milkdown/theme-nord';
  import { replaceAll } from '@milkdown/utils';

  export let value = '';
  export let readOnly = true;
  export let onEnter = (markdown: string) => {}

  let markdownEditor: Promise<Editor>;
  const editable = () => !readOnly;
  let internalEditor: Editor;

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
          const bg = readOnly ? '' : 'bg-neutral-50 border focus:ring-1 shadow prompt'
          return {
            ...prev,
            attributes: { class: `p-1 font-serif text-sm antialiased leading-relaxed rounded-lg ${bg}`, spellcheck: 'false' },
            editable
          }
        })
      })
      .config((ctx) => {
        ctx.get(listenerCtx).focus(onFocus).mounted(onMount).markdownUpdated(onUpdate)
      })
      .use(commonmark)
      .use(listener)
      .create();
  }

  function onFocus() {
    if (!readOnly) {
      internalEditor.action(replaceAll(''))
    }
  }

  function onMount() {
    markdownEditor.then((editor) => {
      const text = value == '' ? '*Write a prompt.*' : value;
      editor.action(replaceAll(text))
      internalEditor = editor;
    })
  }

  function onUpdate(ctx: Ctx, markdown: string) {
    value = markdown;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      const markdown = internalEditor.action((ctx) => {
        const editorView = ctx.get(editorViewCtx);
        const serializer = ctx.get(serializerCtx);
        return serializer(editorView.state.doc);
      });
      internalEditor.action(replaceAll(''))
      onEnter(markdown)
    }
  }
</script>
  
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div use:makeEditor on:keydown={onKeyDown} />

<style>
  /* style for previous dialogues */
  :global(.milkdown p em) {
    color: rgb(82 82 82);
  }

  /* style for input field */
  :global(.milkdown .prompt p em) {
    color: rgb(163 163 163);
  }
</style>