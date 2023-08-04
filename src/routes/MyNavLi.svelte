<script lang="ts">
  import { NavLi } from "flowbite-svelte";
  import { currentTab } from "$lib/store";

  export let path:string;
</script>

<NavLi href={path} active={path == $currentTab} on:click={() => {$currentTab = path}} activeClass='text-sky-400'>
  <slot></slot>
</NavLi>
