<script setup lang="ts">
import { computed } from 'vue'
import { useSite } from '@/composables/useSite'

/**
 * 两段文字都来自后台的「站点信息」。
 * 文档还没到就先空着——宁可空半秒，也不要先闪一下写死的旧版权再跳成新的。
 */
const { bootstrap } = useSite()
const site = computed(() => bootstrap.value?.site ?? null)
</script>

<template>
  <footer class="site-foot">
    <span>{{ site?.footerLeft ?? '' }}</span>
    <span>{{ site?.footerRight ?? '' }}</span>
  </footer>
</template>
