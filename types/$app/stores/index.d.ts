declare module "$app/stores" {
  const page: import('svelte/store').Readable<
    import('@sveltejs/kit').Page
  >
}