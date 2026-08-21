<script setup lang="ts">
/**
 * 简历与关于页的「键 — 值」行。
 * 值由后端渲染成 HTML（行内 Markdown + <br>、<span class="light"> 这类排版标签），
 * 前端只负责摆位置。
 */
defineProps<{ rows: { k: string; vHtml: string }[] }>()
</script>

<template>
  <div class="def-list">
    <div v-for="(row, i) in rows" :key="i" class="def-row">
      <span class="k">{{ row.k }}</span>
      <!-- eslint-disable-next-line vue/no-v-html -- 内容只来自本人后台 -->
      <span class="v" v-html="row.vHtml"></span>
    </div>
  </div>
</template>
