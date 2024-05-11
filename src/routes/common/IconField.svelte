<script lang="ts">
  import { Label } from 'flowbite-svelte'
  import CharIcon from './CharIcon.svelte'
  import NumberField from './NumberField.svelte'

  export let label = ''
  export let name = ''
  export let iconX = 0
  export let iconY = 0
  export let iconSize = 80
  let scale = 1.0
</script>

<div class="w-36 flex p-1">
  <Label for={label} class="text-base self-center text-right w-full">{label}</Label>
</div>
<div class="col-span-2 p-1">
  <CharIcon {name} bind:size={iconSize} bind:offsetX={iconX} bind:offsetY={iconY} bind:scale
  ></CharIcon>
</div>
<NumberField
  label="Icon Size"
  help=""
  bind:value={iconSize}
  defaultValue={80}
  min={32}
  max={128}
  step={4} />
<NumberField
  label="Position X"
  help=""
  bind:value={iconX}
  defaultValue={80}
  min={-128}
  max={128}
  step={4} />
<NumberField
  label="Position Y"
  help=""
  bind:value={iconY}
  defaultValue={80}
  min={-512}
  max={128}
  step={4} />
<NumberField
  label="Scale"
  help=""
  bind:value={scale}
  defaultValue={1.0}
  min={1.0}
  max={10.0}
  step={0.01} />
