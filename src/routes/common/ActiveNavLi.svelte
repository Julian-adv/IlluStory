<script lang="ts">
  import { NavLi } from "flowbite-svelte"
  import { page } from "$app/stores"

  export let path:string
</script>

<NavLi href={path} active={path == $page.url.pathname} activeClass='text-sky-400'>
  <slot></slot>
</NavLi>
