<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import SiteCrumb from '@/components/SiteCrumb.vue'
import StateNote from '@/components/StateNote.vue'

const { ui, sectionOf } = useUi()
const { data, error, loading } = useAsyncData(() => api.photos())
const meta = computed(() => sectionOf('photos'))

useHead(() => ({ title: meta.value.title, description: meta.value.subtitle }))
</script>

<template>
  <SiteCrumb mode="personal" />

  <h1 class="page-title">{{ meta.title || ' ' }}</h1>
  <p class="page-sub">{{ meta.subtitle }}</p>

  <StateNote :loading="loading" :error="error"
             :empty="!loading && !error && data?.items.length === 0"
             :empty-text="ui.states.emptyPhotos" />

  <div v-if="data && data.items.length" class="photo-grid">
    <figure v-for="photo in data.items" :key="photo.id" class="photo-item">
      <div class="photo-frame">
        <img v-if="photo.url" :src="photo.url" :alt="photo.alt" loading="lazy" />
        <span v-else class="empty">{{ ui.photos.emptySlot }}</span>
      </div>
      <figcaption class="photo-cap">
        <span v-if="photo.whenLabel" class="when">{{ photo.whenLabel }}</span>{{ photo.caption }}
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px 24px; }
.photo-item { display: flex; flex-direction: column; gap: 12px; margin: 0; }
.photo-cap { font-size: var(--fs-small); line-height: 1.75; color: var(--body-ink); }
.photo-cap .when { margin-right: 10px; font-size: var(--fs-meta); color: var(--faint); font-variant-numeric: tabular-nums; }
@media (max-width: 560px) { .photo-grid { grid-template-columns: 1fr; } }
</style>
