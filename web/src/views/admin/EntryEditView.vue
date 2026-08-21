<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'
import type { EntryAdmin, EntryKind } from '@/api/types'
import { useSite } from '@/composables/useSite'
import { useHead } from '@/composables/useHead'
import { renderMarkdown } from '@/composables/useMarkdown'

const props = defineProps<{ id: number | null }>()

const router = useRouter()
const { bootstrap } = useSite()
const kinds = computed(() => bootstrap.value?.kinds ?? null)

const form = reactive({
  kind: 'writing' as EntryKind,
  slug: '',
  title: '',
  tag: '',
  dateLabel: '',
  dateFull: '',
  groupLabel: '',
  summary: '',
  bodyMd: '',
  status: 'draft' as 'draft' | 'published',
  sortIndex: 0,
})

const loading = ref(props.id !== null)
const saving = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const loaded = ref<EntryAdmin | null>(null)
const showPreview = ref(true)

const isNew = computed(() => props.id === null)
const previewHtml = computed(() => renderMarkdown(form.bodyMd))

watch(
  () => props.id,
  async (id) => {
    if (id === null) return
    loading.value = true
    try {
      const entry = await api.admin.entry(id)
      loaded.value = entry
      Object.assign(form, {
        kind: entry.kind,
        slug: entry.slug,
        title: entry.title,
        tag: entry.tag ?? '',
        dateLabel: entry.dateLabel,
        dateFull: entry.dateFull ?? '',
        groupLabel: entry.groupLabel ?? '',
        summary: entry.summary,
        bodyMd: entry.bodyMd,
        status: entry.status,
        sortIndex: entry.sortIndex,
      })
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function payload() {
  return {
    kind: form.kind,
    slug: form.slug.trim() || undefined,
    title: form.title.trim(),
    tag: form.tag.trim() || null,
    dateLabel: form.dateLabel.trim(),
    dateFull: form.dateFull.trim() || null,
    groupLabel: form.groupLabel.trim() || null,
    summary: form.summary.trim(),
    bodyMd: form.bodyMd,
    status: form.status,
    sortIndex: Number(form.sortIndex) || 0,
  }
}

async function save(andPublish = false) {
  saving.value = true
  message.value = null
  error.value = null
  const body = payload()
  if (andPublish) body.status = 'published'
  try {
    if (isNew.value) {
      const created = await api.admin.createEntry(body)
      router.replace({ name: 'admin-entry-edit', params: { id: created.id } })
      message.value = '已创建'
    } else {
      const updated = await api.admin.updateEntry(props.id!, body)
      loaded.value = updated
      form.slug = updated.slug
      form.status = updated.status
      message.value = '已保存'
    }
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

useHead(() => ({ title: isNew.value ? '新建内容' : `编辑：${form.title}` }))
</script>

<template>
  <h1 class="admin-title">{{ isNew ? '新建内容' : '编辑内容' }}</h1>
  <p class="admin-sub">
    正文写 Markdown，保存时后端渲染成 HTML 存下来，读者访问时不再二次渲染。
    需要旧站里那种上下加线的旁注，直接写 <code>&lt;div class="aside-note"&gt;…&lt;/div&gt;</code>。
  </p>

  <p v-if="error" class="notice bad">{{ error }}</p>
  <p v-else-if="message" class="notice ok">
    {{ message }}
    <template v-if="loaded?.href && loaded.status === 'published'">
      · <a :href="loaded.href" target="_blank" rel="noopener" style="border-bottom: 1px solid var(--line)">看看效果 ↗</a>
    </template>
  </p>

  <p v-if="loading" class="loading-note">正在读取…</p>

  <form v-else @submit.prevent="save()">
    <div class="field-row">
      <div class="field">
        <label for="kind">栏目</label>
        <select id="kind" v-model="form.kind">
          <option v-for="(conf, kind) in kinds" :key="kind" :value="kind">{{ conf.label }}</option>
        </select>
      </div>
      <div class="field">
        <label for="status">状态</label>
        <select id="status" v-model="form.status">
          <option value="draft">草稿（不对外可见）</option>
          <option value="published">已发布</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label for="title">标题</label>
      <input id="title" v-model="form.title" type="text" required />
      <span class="hint">学习记录没有标题，可以直接填日期，列表页不会显示它。</span>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="dateLabel">列表日期</label>
        <input id="dateLabel" v-model="form.dateLabel" type="text" placeholder="6 月 / 2026 · 5 月 / 2026 至今" />
      </div>
      <div class="field">
        <label for="groupLabel">分组小标题</label>
        <input id="groupLabel" v-model="form.groupLabel" type="text" placeholder="2026 / 在读（留空则不分组）" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="tag">标题后的小标签</label>
        <input id="tag" v-model="form.tag" type="text" placeholder="进行中 / 已完成 / 作者名" />
      </div>
      <div class="field">
        <label for="sortIndex">排序（越小越靠前）</label>
        <input id="sortIndex" v-model.number="form.sortIndex" type="number" />
      </div>
    </div>

    <div class="field">
      <label for="summary">列表摘要</label>
      <textarea id="summary" v-model="form.summary" rows="3" style="font-family: var(--serif); font-size: 14.5px" />
    </div>

    <div class="field-row">
      <div class="field">
        <label for="slug">URL 片段</label>
        <input id="slug" v-model="form.slug" type="text" placeholder="留空自动生成" />
        <span class="hint">改它会让旧链接失效，非必要不动。</span>
      </div>
      <div class="field">
        <label for="dateFull">内页日期行</label>
        <input id="dateFull" v-model="form.dateFull" type="text" placeholder="2026 年 6 月 · 研究笔记 · 约 1,800 字" />
        <span class="hint">用「·」分段，会渲染成内页标题下面那行小字。</span>
      </div>
    </div>

    <div class="field">
      <label>
        正文（Markdown）
        <button class="btn small" type="button" style="margin-left: 12px"
                @click="showPreview = !showPreview">{{ showPreview ? '隐藏预览' : '显示预览' }}</button>
      </label>
      <div :class="showPreview ? 'editor-split' : ''">
        <textarea v-model="form.bodyMd" spellcheck="false" placeholder="留空 = 这条只出现在列表里，没有内页" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="showPreview" class="preview-pane">
          <div class="article-body" v-html="previewHtml"></div>
        </div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn primary" type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存' }}</button>
      <button v-if="form.status === 'draft'" class="btn" type="button" :disabled="saving" @click="save(true)">
        保存并发布
      </button>
      <RouterLink class="btn" :to="{ name: 'admin-entries' }">返回列表</RouterLink>
    </div>
  </form>
</template>
