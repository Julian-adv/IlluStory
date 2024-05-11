<script lang="ts">
  import { Label } from 'flowbite-svelte'
  import CharIcon from './CharIcon.svelte'
  import NumberField from './NumberField.svelte'
  import { realImageSize } from '$lib'

  export let label = ''
  export let name = ''
  export let iconX = 0
  export let iconY = 0
  export let iconSize = 80
  export let partSize = realImageSize(512)
</script>

<div class="w-36 flex p-1">
  <Label for={label} class="text-base self-center text-right w-full">{label}</Label>
</div>
<div class="col-span-2 p-1">
  <CharIcon {name} bind:iconSize bind:iconX bind:iconY bind:partSize />
</div>
<NumberField
  label="Icon Size"
  help=""
  bind:value={iconSize}
  defaultValue={80}
  min={32}
  max={128}
  step={4} />
