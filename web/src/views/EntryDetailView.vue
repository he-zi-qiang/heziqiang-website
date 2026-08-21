<script setup lang="ts">
import { computed, toRef } from 'vue'
import { api } from '@/api/client'
import type { EntryKind } from '@/api/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import { PATH_BY_KIND } from '@/router'
import StateNote from '@/components/StateNote.vue'

const props = defineProps<{ kind: EntryKind; slug: string }>()

const { ui, sectionOf } = useUi()
const slugRef = toRef(props, 'slug')
const { data, error, loading } = useAsyncData(() => api.entry(props.slug), slugRef)

const listPath = computed(() => `/${PATH_BY_KIND[props.kind]}`)
const meta = computed(() => sectionOf(props.kind))

/** 内页 meta 行：优先用条目自带的整行文字，否则用「日期 · 栏目」拼一条 */
const metaLine = computed(() => {
  if (!data.value) return ''
  if (data.value.dateFull) return data.value.dateFull
  return [data.value.dateLabel, meta.value.label].filter(Boolean).join(' · ')
})
const metaParts = computed(() => metaLine.value.split(/\s*·\s*/).filter(Boolean))

/** 文末只显示一个方向：优先下一篇，没有就退回上一篇 */
const sibling = computed(() => {
  if (!data.value) return null
  if (data.value.next) return { entry: data.value.next, prefix: ui.value.article.nextPrefix }
  if (data.value.prev) return { entry: data.value.prev, prefix: ui.value.article.prevPrefix }
  return null
})

useHead(() => ({ title: data.value?.title, description: data.value?.summary }))
</script>

<template>
  <div class="crumb">
    <RouterLink :to="listPath">
      {{ ui.crumb.backPrefix }} {{ meta.label }}<template v-if="meta.en"> · {{ meta.en }}</template>
    </RouterLink>
  </div>

  <StateNote :loading="loading" :error="error" />

  <template v-if="data">
    <h1 class="page-title">{{ data.title }}</h1>
    <p class="article-meta">
      <template v-for="(part, i) in metaParts" :key="i">
        <span v-if="i > 0" class="sep">·</span>{{ part }}
      </template>
    </p>

    <!-- eslint-disable-next-line vue/no-v-html -- 正文由后端 markdown-it 渲染，只有本人能写 -->
    <div class="article-body" v-html="data.bodyHtml"></div>

    <div class="article-end">{{ ui.article.endMark }}</div>

    <nav class="article-next">
      <RouterLink :to="listPath">{{ ui.article.backLabel }}{{ meta.label }}</RouterLink>
      <RouterLink v-if="sibling" :to="`${listPath}/${sibling.entry.slug}`">
        {{ sibling.prefix }}{{ sibling.entry.title }} {{ ui.article.linkSuffix }}
      </RouterLink>
    </nav>
  </template>
</template>
