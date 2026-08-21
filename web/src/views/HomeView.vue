<script setup lang="ts">
import { computed } from 'vue'
import { useMode } from '@/composables/useMode'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'

const { mode } = useMode()
const { bootstrap, error } = useSite()

/** 索引导航是站点结构而非内容，跟着路由走，不进数据库 */
const NAV = {
  pro: [
    { to: '/about', zh: '关于我', en: 'About' },
    { to: '/projects', zh: '项目', en: 'Projects' },
    { to: '/writing', zh: '文章', en: 'Writing' },
    { to: '/cv', zh: '简历', en: 'CV' },
    { to: '/about#contact', zh: '联系', en: 'Contact' },
  ],
  personal: [
    { to: '/essays', zh: '随笔与思考', en: 'Essays' },
    { to: '/reading', zh: '阅读笔记', en: 'Reading' },
    { to: '/learning', zh: '学习记录', en: 'Learning Log' },
    { to: '/photos', zh: '摄影与观察', en: 'Photographs' },
  ],
} as const

const home = computed(() => bootstrap.value?.home ?? null)
const side = computed(() => (home.value ? home.value[mode.value] : null))

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

    <nav class="index-nav">
      <RouterLink v-for="item in NAV[mode]" :key="item.to" class="index-row" :to="item.to">
        <span>{{ item.zh }}</span><span class="en">{{ item.en }}</span>
      </RouterLink>
    </nav>
  </section>
</template>
