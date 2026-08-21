<script setup lang="ts">
import { computed, toRef } from 'vue'
import { api } from '@/api/client'
import type { EntryKind } from '@/api/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import { SECTION_BY_KIND } from '@/router'
import EntryGroups from '@/components/EntryGroups.vue'
import StateNote from '@/components/StateNote.vue'

const props = defineProps<{ kind: EntryKind }>()

const { bootstrap } = useSite()
const kindRef = toRef(props, 'kind')
const { data, error, loading } = useAsyncData(() => api.entries(props.kind), kindRef)

const meta = computed(() => bootstrap.value?.sections?.[props.kind] ?? null)
const backTo = computed(() => ({
  path: '/',
  query: { mode: SECTION_BY_KIND[props.kind] },
}))

useHead(() => ({ title: meta.value?.title, description: meta.value?.subtitle }))
</script>

<template>
  <div class="crumb"><RouterLink :to="backTo">← 索引 · Index</RouterLink></div>

  <h1 class="page-title">{{ meta?.title ?? ' ' }}</h1>
  <p class="page-sub">{{ meta?.subtitle }}</p>

  <StateNote :loading="loading" :error="error" :empty="!loading && !error && data?.total === 0"
             empty-text="这个栏目还没有内容。" />
  <EntryGroups v-if="data && data.total > 0" :groups="data.groups" :kind="kind" />
</template>
