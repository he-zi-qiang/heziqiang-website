<script setup lang="ts">
import { computed } from 'vue'
import { useSite } from '@/composables/useSite'

const { bootstrap } = useSite()
const left = computed(() => bootstrap.value?.site?.footerLeft ?? '© 2024–2026 何梓强')
const right = computed(() => bootstrap.value?.site?.footerRight ?? '始于 2024 · 长期维护')
</script>

<template>
  <footer class="site-foot">
    <span>{{ left }}</span>
    <span>{{ right }}</span>
  </footer>
</template>
