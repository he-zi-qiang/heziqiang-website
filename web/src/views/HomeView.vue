<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { EntryKind, NavRow } from '@/api/types'
import { useMode } from '@/composables/useMode'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import { PATH_BY_KIND } from '@/router'
import StateNote from '@/components/StateNote.vue'

const route = useRoute()
const { mode, setMode } = useMode()

// 内页的面包屑、页眉都带着 ?mode= 回首页：每次进来都按它切到对应的一侧，
// 不然从随笔点「← 索引」可能回到上次停留的专业一侧
watch(
  () => route.query.mode,
  (m) => {
    if (m === 'pro' || m === 'personal') setMode(m)
  },
  { immediate: true },
)
const { bootstrap, error } = useSite()
const { nav, sectionOf } = useUi()

const home = computed(() => bootstrap.value?.home ?? null)
const side = computed(() => (home.value ? home.value[mode.value] : null))
const recent = computed(() => bootstrap.value?.recent?.[mode.value] ?? [])

/** 索引行指向的栏目：/essays → essay，/photos → photos；关于、简历这类单页不算 */
const SECTION_BY_PATH = new Map<string, EntryKind | 'photos'>([
  ...(Object.entries(PATH_BY_KIND) as [EntryKind, string][]).map(([kind, path]) => [`/${path}`, kind] as const),
  ['/photos', 'photos'],
])

/** 还没有内容的栏目不出现在索引里，免得访客点进去扑个空 */
function hasContent(row: NavRow) {
  const counts = bootstrap.value?.counts
  const section = SECTION_BY_PATH.get(row.to.split(/[?#]/)[0]!)
  return !counts || !section || counts[section] > 0
}

const rows = computed(() => (nav.value[mode.value] ?? []).filter(hasContent))

useHead(() => ({ title: null, description: bootstrap.value?.site?.description }))
</script>

<template>
  <StateNote :loading="!home && !error" :error="error" />

  <section v-if="side" :key="mode" class="mode-enter">
    <!-- eslint-disable-next-line vue/no-v-html -- 只有本人后台能写 -->
    <p class="lede" v-html="side.ledeHtml"></p>

    <div class="smallcaps section-label">{{ side.nowLabel }}</div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p class="now" v-html="side.nowHtml"></p>

    <template v-if="recent.length">
      <div class="smallcaps section-label">{{ side.recentLabel }}</div>
      <ul class="recent">
        <li v-for="entry in recent" :key="entry.slug">
          <RouterLink :to="entry.href!">
            <span class="date">{{ entry.dateLabel }}</span>
            <span class="r-title">{{ entry.title }}</span>
            <span class="r-kind">{{ sectionOf(entry.kind).label }}</span>
          </RouterLink>
        </li>
      </ul>
    </template>

    <nav class="index-nav">
      <RouterLink v-for="row in rows" :key="row.to" class="index-row" :to="row.to">
        <span>{{ row.zh }}</span><span class="en">{{ row.en }}</span>
      </RouterLink>
    </nav>
  </section>
</template>
