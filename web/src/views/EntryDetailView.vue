<script setup lang="ts">
import { computed, toRef } from 'vue'
import { api } from '@/api/client'
import type { EntryKind } from '@/api/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import { PATH_BY_KIND } from '@/router'
import StateNote from '@/components/StateNote.vue'

const props = defineProps<{ kind: EntryKind; slug: string }>()

const { bootstrap } = useSite()
const slugRef = toRef(props, 'slug')
const { data, error, loading } = useAsyncData(() => api.entry(props.slug), slugRef)

const listPath = computed(() => `/${PATH_BY_KIND[props.kind]}`)
const listMeta = computed(() => bootstrap.value?.sections?.[props.kind] ?? null)
const kindConf = computed(() => bootstrap.value?.kinds?.[props.kind] ?? null)

/** 内页 meta 行：优先用条目自带的整行文字，否则用「日期 · 栏目」拼一条 */
const metaLine = computed(() => {
  if (!data.value) return ''
  if (data.value.dateFull) return data.value.dateFull
  return [data.value.dateLabel, kindConf.value?.label].filter(Boolean).join(' · ')
})
const metaParts = computed(() => metaLine.value.split(/\s*·\s*/).filter(Boolean))

useHead(() => ({ title: data.value?.title, description: data.value?.summary }))
</script>

<template>
  <div class="crumb">
    <RouterLink :to="listPath">← {{ listMeta?.title ?? kindConf?.label }} · {{ kindConf?.en }}</RouterLink>
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

    <div class="article-end">❡</div>

    <nav class="article-next">
      <RouterLink :to="listPath">← 返回{{ listMeta?.title ?? kindConf?.label }}</RouterLink>
      <RouterLink v-if="data.next" :to="`${listPath}/${data.next.slug}`">
        下一篇：{{ data.next.title }} →
      </RouterLink>
      <RouterLink v-else-if="data.prev" :to="`${listPath}/${data.prev.slug}`">
        上一篇：{{ data.prev.title }} →
      </RouterLink>
    </nav>
  </template>
</template>
