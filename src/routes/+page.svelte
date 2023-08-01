<script lang="ts">
  import '@milkdown/theme-nord/style.css';
  import { onMount } from 'svelte';
  import { loadSettings } from '$lib/fs';
  import { readDir, BaseDirectory, type FileEntry, readTextFile } from '@tauri-apps/api/fs';
  import { Card } from 'flowbite-svelte';
  import type { StoryCard } from '$lib/interfaces';

  let cards:StoryCard[] = [];

  onMount(async () => {
    let models = await loadSettings();

    const entries = await readDir('.', { dir: BaseDirectory.AppData, recursive: true });
    for (const entry of entries) {
      if (entry.name?.endsWith('.json')) {
        let storyText = await readTextFile(entry.path);
        let story = JSON.parse(storyText);
        cards.push({
          name: entry.name.slice(0, -5),
          image: story.image ?? '00007-780430952.png'
        });
      }
    }
    cards = cards;
  })
</script>

<main>
  <div class="flex flex-wrap flex-none gap-2">
    {#each cards as card}
      <Card href='/write' img={card.image} class='w-72'>
        <h2>{card.name}</h2>
      </Card>
    {/each}
  </div>
</main>
