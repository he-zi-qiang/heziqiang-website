<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'
import AdminIcon from '@/components/AdminIcon.vue'

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

/** 「写一篇新的」在页头右上角，这里只放改单页和管照片 */
const QUICK = [
  { title: '改首页文案', desc: '两侧身份的引言和近况', to: { name: 'admin-doc', params: { key: 'home' } } },
  { title: '改关于我', desc: '自我介绍与联系方式', to: { name: 'admin-doc', params: { key: 'about' } } },
  { title: '改简历', desc: '教育、项目与证件照', to: { name: 'admin-doc', params: { key: 'cv' } } },
  { title: '管照片', desc: '摄影页的每一格', to: { name: 'admin-photos' } },
]

useHead(() => ({ title: '写作台' }))
</script>

<template>
  <header class="admin-head">
    <div>
      <h1 class="admin-title">概览</h1>
      <p class="admin-sub">站点内容的当前状态。从左边的「内容」开始写，或者直接从下面的快捷入口进。</p>
    </div>
    <div class="admin-actions">
      <RouterLink class="btn primary" :to="{ name: 'admin-entry-new' }"><AdminIcon name="plus" />写一篇新的</RouterLink>
    </div>
  </header>

  <StateNote :loading="loading" :error="error" />

  <div v-if="data" class="stat-grid">
    <div v-for="c in cards" :key="c.k" class="stat-card">
      <div class="n">{{ c.n }}</div>
      <div class="k">{{ c.k }}</div>
    </div>
  </div>

  <h2 class="admin-h2">快捷入口</h2>
  <div class="quick-grid">
    <RouterLink v-for="q in QUICK" :key="q.title" class="quick-card" :to="q.to">
      <span class="q-title">{{ q.title }}</span>
      <span class="q-desc">{{ q.desc }}</span>
    </RouterLink>
  </div>
</template>
