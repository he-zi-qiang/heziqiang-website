<script setup lang="ts">
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import SiteCrumb from '@/components/SiteCrumb.vue'

const { ui } = useUi()

useHead(() => ({ title: ui.value.notFound.title, description: ui.value.notFound.subtitle }))
</script>

<template>
  <SiteCrumb mode="pro" />
  <h1 class="page-title">{{ ui.notFound.title }}</h1>
  <p class="page-sub">{{ ui.notFound.subtitle }}</p>
  <nav class="index-nav">
    <RouterLink v-for="row in ui.notFound.links" :key="row.to" class="index-card" :to="row.to">
      <span class="ic-zh">{{ row.zh }}</span>
      <span class="ic-en">{{ row.en }}</span>
      <span class="ic-foot"><span></span><span class="ic-arrow" aria-hidden="true">→</span></span>
    </RouterLink>
  </nav>
</template>
