<script setup lang="ts">
import type { Heading } from '@/composables/useArticleHeadings'

/**
 * 长文右侧的目录：只在屏幕够宽、文章有两个以上小标题时出现（见 style.css 的 .toc）。
 * 放在正文右边那片本来空着的白里，跟着滚动停在视口里，并标出当前读到的一节。
 */
defineProps<{ headings: Heading[]; activeId: string | null; label: string }>()
const emit = defineEmits<{ go: [id: string] }>()
</script>

<template>
  <aside v-if="headings.length >= 2" class="toc no-print">
    <nav class="toc-inner" :aria-label="label">
      <div class="smallcaps toc-label">{{ label }}</div>
      <ol>
        <li v-for="h in headings" :key="h.id" :class="[`lv${h.level}`, { on: h.id === activeId }]">
          <a :href="`#${encodeURIComponent(h.id)}`" :aria-current="h.id === activeId ? 'location' : undefined"
             @click.prevent="emit('go', h.id)">{{ h.text }}</a>
        </li>
      </ol>
    </nav>
  </aside>
</template>
