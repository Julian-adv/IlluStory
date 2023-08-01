<script lang="ts">
  import { NavLi } from "flowbite-svelte";
  import { currentPath } from "$lib/store";

  export let path:string;
</script>

<NavLi href={path} active={path == $currentPath} on:click={() => {$currentPath = path}} activeClass='text-sky-400'>
  <slot></slot>
</NavLi>
