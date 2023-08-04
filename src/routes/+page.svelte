<script lang="ts">
  import '@milkdown/theme-nord/style.css';
  import { onMount } from 'svelte';
  import { loadSettings } from '$lib/fs';
  import { readDir, BaseDirectory, type FileEntry, readTextFile } from '@tauri-apps/api/fs';
  import { Card, Spinner } from 'flowbite-svelte';
  import type { StoryCard } from '$lib/interfaces';
  import { currentTab, story, storyPath } from '$lib/store';

  let cards:StoryCard[] = [];
  let loading = false;

  onMount(async () => {
    await loadSettings();

    loading = true;
    const entries = await readDir('.', { dir: BaseDirectory.AppData, recursive: true });
    for (const entry of entries) {
      if (entry.name?.endsWith('.json')) {
        let storyText = await readTextFile(entry.path);
        let story = JSON.parse(storyText);
        cards.push({
          name: entry.name.slice(0, -5),
          path: entry.path,
          image: story.image ?? '00007-780430952.png'
        });
      }
    }
    cards = cards;
    loading = false;
  })

  function onClick(path:string) {
    return async (ev: Event) => {
      const storyText = await readTextFile(path);
      if (storyText) {
        $storyPath = path;
        $story = JSON.parse(storyText);
        $currentTab = '/write';
      }
    }
  }
</script>

<main>
  {#if loading}
    <div class='flex w-full items-center justify-center' style='height: 80vh'>
      <Spinner size='8' />
    </div>
  {:else}
    <div class="flex flex-wrap flex-none gap-2">
      {#each cards as card}
        <Card href='/write' img={card.image} class='w-52' on:click={onClick(card.path)}>
          <h2>{card.name}</h2>
        </Card>
      {/each}
    </div>
  {/if}
</main>
