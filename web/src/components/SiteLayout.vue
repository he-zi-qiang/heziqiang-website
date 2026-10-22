<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from './SiteHeader.vue'
import SiteFooter from './SiteFooter.vue'
import TweaksPanel from './TweaksPanel.vue'

const route = useRoute()
const isDev = import.meta.env.DEV

/** 进站后第一次换页起打上标记，换页动效改用短的那一档（见 style.css） */
const navigated = ref(false)
watch(() => route.path, () => (navigated.value = true))

/** 宽屏下摄影页用满整个版心放大照片，其余页面（含首页）正文保持阅读宽度 */
const pageClass = computed(() => ({
  'is-navigated': navigated.value,
  'is-wide': route.name === 'photos',
}))
</script>

<template>
  <div class="page" :class="pageClass">
    <SiteHeader />
    <!-- key 换页时重建 main，让 style.css 里的「纸页浮起」入场动效重新播放 -->
    <main :key="route.path">
      <slot />
    </main>
    <SiteFooter />
  </div>
  <!-- 纸面 / 强调色微调面板：只在开发环境出现，不会打包进生产 -->
  <TweaksPanel v-if="isDev" />
</template>
