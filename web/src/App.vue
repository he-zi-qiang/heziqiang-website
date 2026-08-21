<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteLayout from '@/components/SiteLayout.vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { useInternalLinks } from '@/composables/useInternalLinks'

const route = useRoute()

// 正文里由 Markdown 渲染出来的站内链接也走前端路由，不整页刷新
useInternalLinks()

/** 三套外壳：站点（纸面设计）、后台、以及登录页这种什么都不套的 */
const layout = computed(() => {
  switch (route.meta.layout) {
    case 'admin':
      return AdminLayout
    case 'bare':
      return null
    default:
      return SiteLayout
  }
})
</script>

<template>
  <component :is="layout" v-if="layout">
    <RouterView />
  </component>
  <RouterView v-else />
</template>
