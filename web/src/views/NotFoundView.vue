<script setup lang="ts">
import { useHead } from '@/composables/useHead'
useHead(() => ({ title: '页面不存在', description: '这个地址下没有内容。' }))
</script>

<template>
  <div class="crumb"><RouterLink to="/">← 索引 · Index</RouterLink></div>
  <h1 class="page-title">404</h1>
  <p class="page-sub">这个地址下没有内容。也许是链接旧了，也许是我把它挪走了。</p>
  <nav class="index-nav">
    <RouterLink class="index-row" to="/"><span>回到首页</span><span class="en">Index</span></RouterLink>
    <RouterLink class="index-row" to="/writing"><span>看看文章</span><span class="en">Writing</span></RouterLink>
    <RouterLink class="index-row" to="/essays"><span>看看随笔</span><span class="en">Essays</span></RouterLink>
  </nav>
</template>
