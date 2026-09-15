<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<template>
  <div class="bar" role="progressbar" :aria-valuenow="value" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: value + '%' }" /></div>
</template>

