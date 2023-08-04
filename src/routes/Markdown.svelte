<script lang="ts">
  import { Editor, rootCtx, editorViewOptionsCtx, editorViewCtx, serializerCtx } from '@milkdown/core';
  import type { Ctx } from '@milkdown/ctx';
  import { listener, listenerCtx } from '@milkdown/plugin-listener';
  import { history } from '@milkdown/plugin-history';
  import { commonmark } from '@milkdown/preset-commonmark';
  import { nord } from '@milkdown/theme-nord';
  import { replaceAll } from '@milkdown/utils';
  import { afterUpdate } from 'svelte';
  
  export let value = '';
  export let readOnly = true;
  export let onEnter = (markdown: string) => {}

  let markdownEditor: Promise<Editor>;
  const editable = () => !readOnly;
  let internalEditor: Editor;
  let first = true;

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
          const bg = readOnly ? '' : 'p-2 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 border focus:border-2 dark:border-gray-600 rounded-lg prompt'
          return {
            ...prev,
            attributes: { class: `prose font-serif leading-relaxed z-0 ${bg}`, spellcheck: 'false' },
            editable
          }
        })
      })
      .config((ctx) => {
        ctx.get(listenerCtx).focus(onFocus).mounted(onMount).markdownUpdated(onUpdate)
      })
      .use(commonmark)
      .use(history)
      .use(listener)
      .create();
  }

  function onFocus() {
    if (!readOnly && first) {
      internalEditor.action(replaceAll(''))
      first = false;
    }
  }

  function onMount() {
    markdownEditor.then((editor) => {
      let text;
      if (value) {
        text = value;
        first = false;
      } else {
        text = '*Write a prompt.*';
        first = true;
      }
      editor.action(replaceAll(text))
      internalEditor = editor;
    })
  }

  let dontUpdate = false;

  afterUpdate(() => {
    if (internalEditor && !dontUpdate) {
      internalEditor.action(replaceAll(value))
    }
    dontUpdate = false;
  })

  let enterPressed = false;

  function onUpdate(ctx: Ctx, markdown: string, prevMarkdown: string) {
    dontUpdate = true;
    if (enterPressed) {
      value = prevMarkdown;
      enterPressed = false;
    } else {
      value = markdown;
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      enterPressed = true;
      internalEditor.action(replaceAll(''))
      onEnter(value);
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