<script setup lang="ts">
import type { ParticleDiagram } from '../../types/quiz'
defineProps<{ diagram: ParticleDiagram }>()
</script>

<template>
  <figure class="particle-board"><div class="particle-field"><div v-for="(molecule, i) in diagram.molecules" :key="`${molecule}-${i}`" class="particle-molecule" :class="`molecule-${molecule.length}`"><i v-for="(atom, j) in molecule.split('')" :key="j" :class="`atom-${atom}`">{{ atom }}</i></div></div><figcaption>{{ diagram.caption }}</figcaption></figure>
</template>

