<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import DefList from '@/components/DefList.vue'
import SiteCrumb from '@/components/SiteCrumb.vue'
import StateNote from '@/components/StateNote.vue'

const { data, error, loading } = useAsyncData(() => api.doc.cv())
const { bootstrap } = useSite()
const { ui } = useUi()

/** 模板里拿不到 window，包一层 */
function print() {
  window.print()
}

const description = computed(() => data.value?.subtitle || bootstrap.value?.site?.description)

useHead(() => ({ title: data.value?.title, description: description.value }))
</script>

<template>
  <SiteCrumb mode="pro" />

  <StateNote :loading="loading" :error="error" />

  <template v-if="data">
    <h1 class="page-title">{{ data.title }}</h1>
    <p class="page-sub">
      {{ data.subtitle }}
      <span class="sep" style="margin: 0 10px">·</span>
      <a class="no-print" href="#" style="border-bottom: 1px solid var(--line)"
         @click.prevent="print()">{{ ui.cv.printLabel }}</a>
    </p>

    <template v-for="section in data.sections" :key="section.label">
      <div class="smallcaps section-label">{{ section.label }}</div>
      <DefList :rows="section.rows" />
    </template>
  </template>
</template>
