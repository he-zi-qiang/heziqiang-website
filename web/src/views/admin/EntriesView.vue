<script setup lang="ts">
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { EntryAdmin, EntryKind } from '@/api/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'

const { bootstrap } = useSite()
const filter = ref<'' | EntryKind>('')
const { data, error, loading, reload } = useAsyncData(() => api.admin.entries())

const kinds = computed(() => bootstrap.value?.kinds ?? null)
const rows = computed(() => {
  const items = data.value?.items ?? []
  return filter.value ? items.filter((e) => e.kind === filter.value) : items
})

const busy = ref<number | null>(null)
const message = ref<string | null>(null)

function kindLabel(kind: EntryKind) {
  return kinds.value?.[kind]?.label ?? kind
}

async function togglePublish(entry: EntryAdmin) {
  busy.value = entry.id
  try {
    await api.admin.updateEntry(entry.id, {
      status: entry.status === 'published' ? 'draft' : 'published',
    })
    await reload()
  } catch (err) {
    message.value = (err as Error).message
  } finally {
    busy.value = null
  }
}

async function remove(entry: EntryAdmin) {
  if (!confirm(`确定删除「${entry.title}」？这一步无法撤销。`)) return
  busy.value = entry.id
  try {
    await api.admin.deleteEntry(entry.id)
    await reload()
    message.value = `已删除「${entry.title}」`
  } catch (err) {
    message.value = (err as Error).message
  } finally {
    busy.value = null
  }
}

/** 在同栏目里上下移动：把整栏的 id 顺序重排后一次提交 */
async function move(entry: EntryAdmin, delta: -1 | 1) {
  const sameKind = (data.value?.items ?? []).filter((e) => e.kind === entry.kind)
  const idx = sameKind.findIndex((e) => e.id === entry.id)
  const target = idx + delta
  if (idx < 0 || target < 0 || target >= sameKind.length) return
  const ids = sameKind.map((e) => e.id)
  ;[ids[idx], ids[target]] = [ids[target]!, ids[idx]!]
  busy.value = entry.id
  try {
    await api.admin.reorder(ids)
    await reload()
  } catch (err) {
    message.value = (err as Error).message
  } finally {
    busy.value = null
  }
}

useHead(() => ({ title: '内容' }))
</script>

<template>
  <h1 class="admin-title">内容</h1>
  <p class="admin-sub">
    文章、项目、随笔、阅读与学习记录都在这张表里。正文留空的条目只会出现在列表页，不生成内页——
    和旧站里那些不可点击的条目是一回事。
  </p>

  <p v-if="message" class="notice ok">{{ message }}</p>

  <div class="btn-row" style="margin-top: 0; margin-bottom: 24px">
    <RouterLink class="btn primary" :to="{ name: 'admin-entry-new' }">＋ 新建</RouterLink>
    <select v-model="filter" style="font-family: inherit; font-size: 13.5px; padding: 7px 10px;
            border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink)">
      <option value="">全部栏目</option>
      <option v-for="(conf, kind) in kinds" :key="kind" :value="kind">{{ conf.label }}</option>
    </select>
  </div>

  <StateNote :loading="loading" :error="error" :empty="!loading && rows.length === 0"
             empty-text="还没有内容。" />

  <table v-if="rows.length" class="admin-table">
    <thead>
      <tr>
        <th style="width: 84px">栏目</th>
        <th>标题</th>
        <th style="width: 96px">日期</th>
        <th style="width: 80px">状态</th>
        <th style="width: 190px"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in rows" :key="entry.id">
        <td style="color: var(--muted); font-size: 13px">{{ kindLabel(entry.kind) }}</td>
        <td>
          <RouterLink class="t-title" :to="{ name: 'admin-entry-edit', params: { id: entry.id } }">
            {{ entry.title }}
          </RouterLink>
          <div class="t-sub">
            {{ entry.bodyMd ? '有正文' : '仅列表' }} · {{ entry.slug }}
            <template v-if="entry.groupLabel"> · 分组 {{ entry.groupLabel }}</template>
          </div>
        </td>
        <td style="color: var(--faint); font-size: 13px">{{ entry.dateLabel }}</td>
        <td>
          <span class="pill" :class="entry.status">{{ entry.status === 'published' ? '已发布' : '草稿' }}</span>
        </td>
        <td class="actions">
          <button class="btn small" type="button" :disabled="busy === entry.id" @click="move(entry, -1)">↑</button>
          <button class="btn small" type="button" :disabled="busy === entry.id" @click="move(entry, 1)">↓</button>
          <button class="btn small" type="button" :disabled="busy === entry.id" @click="togglePublish(entry)">
            {{ entry.status === 'published' ? '转草稿' : '发布' }}
          </button>
          <button class="btn small danger" type="button" :disabled="busy === entry.id" @click="remove(entry)">删</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
