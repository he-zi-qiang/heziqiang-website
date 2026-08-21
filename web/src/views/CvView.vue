<script setup lang="ts">
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useHead } from '@/composables/useHead'
import DefList from '@/components/DefList.vue'
import StateNote from '@/components/StateNote.vue'

const { data, error, loading } = useAsyncData(() => api.doc.cv())

/** 模板里拿不到 window，包一层 */
function print() {
  window.print()
}

useHead(() => ({ title: data.value?.title, description: '何梓强的简历：教育、经历、项目与技能。' }))
</script>

<template>
  <div class="crumb"><RouterLink :to="{ path: '/', query: { mode: 'pro' } }">← 索引 · Index</RouterLink></div>

  <StateNote :loading="loading" :error="error" />

  <template v-if="data">
    <h1 class="page-title">{{ data.title }}</h1>
    <p class="page-sub">
      {{ data.subtitle }}
      <span class="sep" style="margin: 0 10px">·</span>
      <a class="no-print" href="#" style="border-bottom: 1px solid var(--line)"
         @click.prevent="print()">打印 / 存为 PDF</a>
    </p>

    <template v-for="section in data.sections" :key="section.label">
      <div class="smallcaps section-label">{{ section.label }}</div>
      <DefList :rows="section.rows" />
    </template>
  </template>
</template>
