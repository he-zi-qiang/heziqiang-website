<script setup lang="ts">
import type { EntrySummary } from '@/api/types'

defineProps<{ entry: EntrySummary; showTitle?: boolean }>()
</script>

<template>
  <!-- 有内页的条目整块可点，没有的就是一段静态文字：与旧站的 a.entry / div.entry 完全一致 -->
  <component :is="entry.href ? 'RouterLink' : 'div'" class="entry" :to="entry.href ?? undefined">
    <span class="date">{{ entry.dateLabel }}</span>
    <span>
      <h3 v-if="showTitle !== false" class="e-title">
        {{ entry.title }}<span v-if="entry.tag" class="tag">{{ entry.tag }}</span>
      </h3>
      <p v-if="entry.summary" class="e-note">{{ entry.summary }}</p>
    </span>
  </component>
</template>
