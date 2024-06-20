<script lang="ts">
  import { settings, user, chars } from '$lib/store'
  import { marked } from 'marked'
  import FlexibleTextarea from './FlexibleTextarea.svelte'
  import { Button, Spinner } from 'flowbite-svelte'
  import { getUniqueId, translateButtonClass } from '$lib'

  export let value = ''
  export let translatedValue = ''
  export let waiting = false
  export let translated = false
  export let readOnly = true
  export let placeholder = ''
  export let onEnter = stopEditing
  export let onArrowUp = () => {}
  export let onArrowDown = () => {}
  export let onTranslate = () => {}
  export let onEditDone = (_content: string) => {}
  export let onModify = (_content: string) => {}
  export let generateNewImage = () => {}
  const id = getUniqueId()

  $: markdown = convertToMarkdown(value)
  $: translatedMarkdown = convertToMarkdown(translatedValue)

  $: cssVarStyles = `--dialog-color:${$settings.dialogSettings.color};--dialog-weight:${
    $settings.dialogSettings.bold ? 'bold' : 'normal'
  };--dialog-style:${$settings.dialogSettings.italic ? 'italic' : 'normal'};--desc-color:${
    $settings.descriptionSettings.color
  };--desc-weight:${$settings.descriptionSettings.bold ? 'bold' : 'normal'};--desc-style:${
    $settings.descriptionSettings.italic ? 'italic' : 'normal'
  };--userName-color:${$settings.userNameSettings.color};--userName-weight:${
    $settings.userNameSettings.bold ? 'bold' : 'normal'
  };--userName-style:${$settings.userNameSettings.italic ? 'italic' : 'normal'};--charName-color:${
    $settings.charNameSettings.color
  };--charName-weight:${$settings.charNameSettings.bold ? 'bold' : 'normal'};--charName-style:${
    $settings.charNameSettings.italic ? 'italic' : 'normal'
  };--font-family:${$settings.fontFamily};--font-size:${$settings.fontSize}pt;`

  marked.use({
    breaks: true,
    gfm: true
  })

  let edited = false

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.stopImmediatePropagation()
      onEnter(value)
    } else if (event.key === 'ArrowUp') {
      const textarea = event.target as HTMLTextAreaElement
      if (textarea.selectionStart == 0) {
        event.preventDefault()
        event.stopImmediatePropagation()
        onArrowUp()
      }
    } else if (event.key === 'ArrowDown') {
      const textarea = event.target as HTMLTextAreaElement
      if (textarea.selectionStart == textarea.textLength) {
        event.preventDefault()
        event.stopImmediatePropagation()
        onArrowDown()
      }
    } else {
      const ignoredKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Shift',
        'Control',
        'Alt',
        'Escape',
        'Tab'
      ]

      if (!ignoredKeys.includes(event.key)) {
        edited = true
      } else {
        edited = false
      }
    }
  }

  function onInput(str: string) {
    if (edited) {
      onModify(str)
      edited = false
    }
  }

  $: transButtonClass = translateButtonClass(translated)

  async function toggleTranslate() {
    translated = !translated
    onTranslate()
  }

  function stopEditing(markdown: string) {
    readOnly = true
    onEditDone(markdown)
  }

  function edit() {
    readOnly = false
    // if (visualValue) {
    //   value = value + `\n${visualStart}${visualValue}${visualEnd}`
    // }
    const textarea = document.getElementById(id) as HTMLTextAreaElement
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }

  function convertToMarkdown(str: string) {
    if ($settings.convertMarkdown && str) {
      let text = str
      text = text.replace(/(?!=)["“]([^"”]+)["”]/g, '<em class=\'dialog\'>"$1"</em>')
      text = text.replace(
        /(?<=^|\n|> |>, |[.!?] )([^<".\n]*?)(?=((\.+|!|\?)($| |\n|<em))|( <em))/g,
        "<span class='description'>$1</span>"
      )
      text = text.replace(/(?<=>"[^"]*?)<span class='description'>(?=.*?"<)/g, '<span>')
      text = text.replace(/\n\n/g, '\n<div class="line-break"></div>')
      text = text.replace(/\n/g, '<br>')
      const userNameRegex = new RegExp($user.name, 'g')
      text = text.replace(userNameRegex, "<span class='userName'>$&</span>")
      for (const char of $chars) {
        const charNameRegex = new RegExp(char.name, 'g')
        text = text.replace(charNameRegex, "<span class='charName'>$&</span>")
      }
      return text
    }
    return str ? str : ''
  }
</script>

{#if readOnly}
  <div class="font-serif prose leading-relaxed markdown text-gray-900" style={cssVarStyles}>
    {#if translated}
      {@html marked.parse(translatedMarkdown)}
    {:else}
      {@html marked.parse(markdown)}
    {/if}
    {#if waiting}
      <Spinner class="mr-3" size="3" />
    {:else}
      <Button
        color="alternative"
        class={`w-6 h-6 p-0 focus:ring-0 bg-stone-100 inline-flex justify-center ml-1 ${transButtonClass}`}
        on:click={toggleTranslate}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
        </svg>
      </Button>
      <Button
        color="alternative"
        class={'w-6 h-6 p-0 focus:ring-0 bg-stone-100 inline-flex justify-center ml-1 text-stone-400 focus:text-stone-400'}
        on:click={edit}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </Button>
      <Button
        color="alternative"
        class={'w-6 h-6 p-0 focus:ring-0 bg-stone-100 inline-flex justify-center ml-1 text-stone-400 focus:text-stone-400'}
        on:click={generateNewImage}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      </Button>
    {/if}
  </div>
{:else}
  <FlexibleTextarea
    {id}
    bind:value
    {placeholder}
    unWrappedClass="px-2 py-1.5 focus:ring-gray-200 focus:border-gray-200 focus:ring-4 font-serif prompt"
    style={cssVarStyles}
    on:keydown={onKeyDown}
    {onInput} />
{/if}

<style>
  :global(.markdown) {
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .dialog) {
    color: var(--dialog-color, black);
    font-weight: var(--dialog-weight, normal);
    font-style: var(--dialog-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown p) {
    color: var(--dialog-color, black);
    font-weight: var(--dialog-weight, normal);
    font-style: var(--dialog-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .description) {
    color: var(--desc-color, black);
    font-weight: var(--desc-weight, normal);
    font-style: var(--desc-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown em) {
    color: var(--desc-color, gray);
    font-weight: var(--desc-weight, normal);
    font-style: var(--desc-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .userName) {
    color: var(--userName-color, black);
    font-weight: var(--userName-weight, normal);
    font-style: var(--userName-style, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(.markdown .charName) {
    color: var(--charName-color, black);
    font-weight: var(--charName-weight, normal);
    font-family: var(--font-family, Geogia);
    font-size: var(--font-size, 12pt);
  }

  :global(textarea.prompt) {
    font-family: var(--font-family, Geogia);
  }

  :global(.markdown > p + p) {
    margin-top: 0.5rem;
  }

  :global(.markdown .line-break) {
    display: block;
    height: 0.5em;
  }
</style>
