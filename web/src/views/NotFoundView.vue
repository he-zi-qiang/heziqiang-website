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
    <RouterLink v-for="row in ui.notFound.links" :key="row.to" class="index-row" :to="row.to">
      <span>{{ row.zh }}</span><span class="en">{{ row.en }}</span>
    </RouterLink>
  </nav>
</template>
