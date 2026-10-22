<script setup lang="ts">
import type { Heading } from '@/composables/useArticleHeadings'

/**
 * 长文的目录：放在宽屏右栏里（窄屏右栏不显示），文章有两个以上小标题时才出现，
 * 跟着滚动标出当前读到的一节。
 */
defineProps<{ headings: Heading[]; activeId: string | null; label: string }>()
const emit = defineEmits<{ go: [id: string] }>()
</script>

<template>
  <div v-if="headings.length >= 2" class="toc">
    <nav class="toc-inner" :aria-label="label">
      <div class="smallcaps toc-label">{{ label }}</div>
      <ol>
        <li v-for="h in headings" :key="h.id" :class="[`lv${h.level}`, { on: h.id === activeId }]">
          <a :href="`#${encodeURIComponent(h.id)}`" :aria-current="h.id === activeId ? 'location' : undefined"
             @click.prevent="emit('go', h.id)">{{ h.text }}</a>
        </li>
      </ol>
    </nav>
  </div>
</template>
