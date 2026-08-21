<script setup lang="ts">
import { useRoute } from 'vue-router'
import SiteHeader from './SiteHeader.vue'
import SiteFooter from './SiteFooter.vue'
import TweaksPanel from './TweaksPanel.vue'

const route = useRoute()
const isDev = import.meta.env.DEV
</script>

<template>
  <div class="page">
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
