<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'

const { bootstrap } = useSite()
const { data, error, loading } = useAsyncData(() => api.photos())
const meta = computed(() => bootstrap.value?.sections?.photos ?? null)

useHead(() => ({ title: meta.value?.title, description: meta.value?.subtitle }))
</script>

<template>
  <div class="crumb"><RouterLink :to="{ path: '/', query: { mode: 'personal' } }">← 索引 · Index</RouterLink></div>

  <h1 class="page-title">{{ meta?.title ?? ' ' }}</h1>
  <p class="page-sub">{{ meta?.subtitle }}</p>

  <StateNote :loading="loading" :error="error"
             :empty="!loading && !error && data?.items.length === 0" empty-text="还没有照片。" />

  <div v-if="data && data.items.length" class="photo-grid">
    <figure v-for="photo in data.items" :key="photo.id" class="photo-item">
      <div class="photo-frame">
        <img v-if="photo.url" :src="photo.url" :alt="photo.alt" loading="lazy" />
        <span v-else class="empty">待补图</span>
      </div>
      <figcaption class="photo-cap">
        <span v-if="photo.whenLabel" class="when">{{ photo.whenLabel }}</span>{{ photo.caption }}
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px 36px; }
.photo-item { display: flex; flex-direction: column; gap: 14px; margin: 0; }
.photo-cap { font-size: 13.5px; line-height: 1.9; color: var(--muted); }
.photo-cap .when { color: var(--faint); margin-right: 10px; font-size: 12.5px; }
@media (max-width: 560px) { .photo-grid { grid-template-columns: 1fr; } }
</style>
