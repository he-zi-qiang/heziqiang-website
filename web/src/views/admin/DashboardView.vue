<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'

const { bootstrap } = useSite()
const { data, error, loading } = useAsyncData(() => api.admin.stats())

const cards = computed(() => {
  if (!data.value) return []
  const kinds = bootstrap.value?.kinds
  const rows = Object.entries(data.value.byKind).map(([kind, n]) => ({
    k: kinds?.[kind as keyof typeof kinds]?.label ?? kind,
    n: n ?? 0,
  }))
  rows.push({ k: '照片', n: data.value.photos })
  rows.push({ k: '草稿', n: data.value.drafts })
  return rows
})

useHead(() => ({ title: '写作台' }))
</script>

<template>
  <h1 class="admin-title">概览</h1>
  <p class="admin-sub">站点内容的当前状态。点上面的「内容」开始写，或者直接从下面的快捷入口进。</p>

  <StateNote :loading="loading" :error="error" />

  <div v-if="data" class="stat-grid">
    <div v-for="c in cards" :key="c.k" class="stat-card">
      <div class="n">{{ c.n }}</div>
      <div class="k">{{ c.k }}</div>
    </div>
  </div>

  <div class="section-block">
    <h3>快捷入口</h3>
    <div class="btn-row" style="margin-top: 0">
      <RouterLink class="btn primary" :to="{ name: 'admin-entry-new' }">写一篇新的</RouterLink>
      <RouterLink class="btn" :to="{ name: 'admin-doc', params: { key: 'home' } }">改首页文案</RouterLink>
      <RouterLink class="btn" :to="{ name: 'admin-doc', params: { key: 'about' } }">改关于我</RouterLink>
      <RouterLink class="btn" :to="{ name: 'admin-doc', params: { key: 'cv' } }">改简历</RouterLink>
      <RouterLink class="btn" :to="{ name: 'admin-photos' }">管照片</RouterLink>
    </div>
  </div>
</template>
