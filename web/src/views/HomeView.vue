<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMode } from '@/composables/useMode'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'
import { useNavRows } from '@/composables/useNavRows'

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
const { sectionOf } = useUi()

const home = computed(() => bootstrap.value?.home ?? null)
const side = computed(() => (home.value ? home.value[mode.value] : null))
const recent = computed(() => bootstrap.value?.recent?.[mode.value] ?? [])

const rows = useNavRows(mode)

useHead(() => ({ title: null, description: bootstrap.value?.site?.description }))
</script>

<template>
  <StateNote :loading="!home && !error" :error="error" />

  <div v-if="side" :key="mode" class="mode-enter">
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

    <!-- 索引：宽屏在左栏导航里，窄屏留在正文最后 -->
    <nav class="index-nav only-narrow">
      <RouterLink v-for="row in rows" :key="row.to" class="index-row" :to="row.to">
        <span>{{ row.zh }}</span><span class="en">{{ row.en }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
