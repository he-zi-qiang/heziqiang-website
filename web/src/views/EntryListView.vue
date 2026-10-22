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
import TwoCol from '@/components/TwoCol.vue'

const props = defineProps<{ kind: EntryKind }>()

const { ui, sectionOf } = useUi()
const kindRef = toRef(props, 'kind')
const { data, error, loading } = useAsyncData(() => api.entries(props.kind), kindRef)

const meta = computed(() => sectionOf(props.kind))

/** 宽屏右栏的年份索引：每个年份小标题一行，带条数，点了跳到那一组 */
const years = computed(() =>
  (data.value?.groups ?? [])
    .filter((g) => g.label)
    .map((g) => ({ label: g.label!, count: g.items.length })),
)

useHead(() => ({ title: meta.value.title, description: meta.value.subtitle }))
</script>

<template>
  <SiteCrumb :mode="SECTION_BY_KIND[kind]" />

  <TwoCol>
    <h1 class="page-title">{{ meta.title || ' ' }}</h1>
    <!-- 栏目简介：宽屏在右栏 -->
    <p class="page-sub only-narrow">{{ meta.subtitle }}</p>

    <div class="list-body">
      <StateNote :loading="loading" :error="error" :empty="!loading && !error && data?.total === 0" />
      <EntryGroups v-if="data && data.total > 0" :groups="data.groups" :kind="kind" />
    </div>

    <template #aside>
      <p class="side-intro">{{ meta.subtitle }}</p>
      <nav v-if="years.length" class="side-block side-years" :aria-label="ui.list.yearsLabel">
        <div class="smallcaps section-label">{{ ui.list.yearsLabel }}</div>
        <RouterLink v-for="y in years" :key="y.label" :to="{ hash: `#y-${y.label}` }">
          <span>{{ y.label }}</span><span class="count">{{ y.count }} {{ ui.list.countUnit }}</span>
        </RouterLink>
      </nav>
    </template>
  </TwoCol>
</template>
