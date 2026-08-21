<script setup lang="ts">
import { useUi } from '@/composables/useUi'

/**
 * 列表页顶部那条回首页的面包屑。
 * 文字由「界面文案 · 面包屑」决定，回链方向由所属身份决定。
 */
defineProps<{ mode: 'pro' | 'personal' }>()
const { ui } = useUi()
</script>

<template>
  <div class="crumb">
    <RouterLink :to="{ path: '/', query: { mode } }">{{ ui.crumb.index }}</RouterLink>
  </div>
</template>
