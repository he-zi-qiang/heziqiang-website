<script setup lang="ts">
import { computed, toRef } from 'vue'
import { api } from '@/api/client'
import type { EntryKind } from '@/api/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import { SECTION_BY_KIND } from '@/router'
import EntryGroups from '@/components/EntryGroups.vue'
import SiteCrumb from '@/components/SiteCrumb.vue'
import StateNote from '@/components/StateNote.vue'

const props = defineProps<{ kind: EntryKind }>()

const { sectionOf } = useUi()
const kindRef = toRef(props, 'kind')
const { data, error, loading } = useAsyncData(() => api.entries(props.kind), kindRef)

const meta = computed(() => sectionOf(props.kind))

useHead(() => ({ title: meta.value.title, description: meta.value.subtitle }))
</script>

<template>
  <SiteCrumb :mode="SECTION_BY_KIND[kind]" />

  <h1 class="page-title">{{ meta.title || ' ' }}</h1>
  <p class="page-sub">{{ meta.subtitle }}</p>

  <StateNote :loading="loading" :error="error" :empty="!loading && !error && data?.total === 0" />
  <EntryGroups v-if="data && data.total > 0" :groups="data.groups" :kind="kind" />
</template>
