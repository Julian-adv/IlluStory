<script lang="ts">
  import { iconForName } from '$lib'
  import { chars, user } from '$lib/store'

  export let name: string
  export let size: number
  export let offsetX: number
  export let offsetY: number
  export let scale: number
  $: styles = `float: left;--iconWidth:${size}px;--iconHeight:${
    size + 24
  }px;--iconX:${-offsetX}px;--iconY:${-offsetY}px;--scale:scale(${scale});`
</script>

<div style={styles} class="mr-4 char-icon text-stone-50">
  <div class="char-icon-img-wrapper">
    <img src={iconForName($chars, $user, name)} alt={name} />
  </div>
  <div>{name}</div>
</div>

<style>
  .char-icon {
    position: relative;
    overflow: hidden;
    width: var(--iconWidth);
    height: var(--iconHeight);
    display: flex;
    justify-content: center;
    flex-direction: column;
  }

  .char-icon-img-wrapper {
    width: var(--iconWidth);
    height: var(--iconWidth);
    top: 0;
    overflow: hidden;
  }

  .char-icon img {
    /* max-width: var(--max-width); */
    transform: var(--scale);
    position: absolute;
    top: var(--iconY);
    left: var(--iconX);
  }

  .char-icon div {
    position: absolute;
    bottom: 0;
    color: beige;
    background-color: black;
    min-width: var(--iconWidth);
    text-align: center;
  }
</style>
