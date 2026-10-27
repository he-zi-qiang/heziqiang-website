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
const { ui, sectionOf } = useUi()

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

    <!-- 「目前」是一张浅底的状态卡片，标签前一个小圆点，表示这是正在发生的事 -->
    <section class="now-card">
      <div class="smallcaps section-label">{{ side.nowLabel }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="now" v-html="side.nowHtml"></p>
    </section>

    <template v-if="recent.length">
      <div class="smallcaps section-label">{{ side.recentLabel }}</div>
      <ul class="recent">
        <li v-for="entry in recent" :key="entry.slug">
          <RouterLink :to="entry.href!">
            <span class="r-main">
              <span class="r-title">{{ entry.title }}</span>
              <span v-if="entry.summary" class="r-note">{{ entry.summary }}</span>
            </span>
            <span class="r-side">
              <span class="r-kind">{{ sectionOf(entry.kind).label }}</span>
              <span class="date">{{ entry.dateLabel }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </template>

    <!-- 栏目卡片：窄屏的主导航；宽屏有左栏导航，不再重复 -->
    <nav class="index-nav home-index">
      <RouterLink v-for="row in rows" :key="row.to" class="index-card" :to="row.to">
        <span class="ic-zh">{{ row.zh }}</span>
        <span class="ic-en">{{ row.en }}</span>
        <span class="ic-foot">
          <span>{{ row.count ? `${row.count} ${ui.list.countUnit}` : '' }}</span>
          <span class="ic-arrow" aria-hidden="true">→</span>
        </span>
      </RouterLink>
    </nav>
  </div>
</template>
