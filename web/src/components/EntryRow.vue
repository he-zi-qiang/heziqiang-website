<script setup lang="ts">
import type { EntrySummary } from '@/api/types'

defineProps<{ entry: EntrySummary; showTitle?: boolean }>()
</script>

<template>
  <!-- 有内页的条目整块可点，没有的就是一段静态文字。
       左边是标题和摘要，右边是日期和主题；窄屏日期、主题挪到标题上面一行 -->
  <component :is="entry.href ? 'RouterLink' : 'div'" class="entry" :to="entry.href ?? undefined">
    <span class="e-main">
      <h3 v-if="showTitle !== false" class="e-title">
        {{ entry.title }}<span v-if="entry.tag" class="tag">{{ entry.tag }}</span><span
          v-if="entry.href" class="e-arrow" aria-hidden="true">→</span>
      </h3>
      <p v-if="entry.summary" class="e-note">{{ entry.summary }}</p>
    </span>
    <span class="e-side">
      <span class="date">{{ entry.dateLabel }}</span>
      <span v-if="entry.groupLabel" class="topic">{{ entry.groupLabel }}</span>
    </span>
  </component>
</template>
