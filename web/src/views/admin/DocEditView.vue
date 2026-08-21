<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api } from '@/api/client'
import type { AboutDocSource, CvDocSource, HomeDocSource, NavDoc, SectionsDoc, SiteDoc, UiDoc } from '@/api/types'
import { useHead } from '@/composables/useHead'
import { useSite } from '@/composables/useSite'
import { UI_GROUPS, getPath, setPath } from '@/composables/uiFields'
import NavRowsEditor from '@/components/NavRowsEditor.vue'

const props = defineProps<{ docKey: string }>()

const TABS = [
  { key: 'home', label: '首页文案' },
  { key: 'about', label: '关于我' },
  { key: 'cv', label: '简历' },
  { key: 'sections', label: '栏目名称' },
  { key: 'nav', label: '首页导航' },
  { key: 'ui', label: '界面文案' },
  { key: 'site', label: '站点信息' },
] as const

const { reload: reloadSite } = useSite()

const doc = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const saving = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

const label = computed(() => TABS.find((t) => t.key === props.docKey)?.label ?? props.docKey)

// 每种文档一份具体类型的视图，模板里就不用到处断言了
const site = computed(() => doc.value as unknown as SiteDoc)
const home = computed(() => doc.value as unknown as HomeDocSource)
const about = computed(() => doc.value as unknown as AboutDocSource)
const cv = computed(() => doc.value as unknown as CvDocSource)
const sections = computed(() => doc.value as unknown as SectionsDoc)
const nav = computed(() => doc.value as unknown as NavDoc)
const ui = computed(() => doc.value as unknown as UiDoc)

/** 界面文案的字段是嵌套的，用路径读写，省掉三十个手写 v-model */
function uiValue(path: string) {
  return getPath(doc.value, path)
}
function setUiValue(path: string, event: Event) {
  if (!doc.value) return
  setPath(doc.value, path, (event.target as HTMLInputElement | HTMLTextAreaElement).value)
}

watch(
  () => props.docKey,
  async (key) => {
    loading.value = true
    error.value = null
    message.value = null
    try {
      // 走后台接口拿原始 Markdown 源码，而不是公开接口那份渲染好的 HTML
      doc.value = await api.admin.doc<Record<string, unknown>>(key)
    } catch (err) {
      error.value = (err as Error).message
      doc.value = null
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

async function save() {
  if (!doc.value) return
  saving.value = true
  message.value = null
  error.value = null
  try {
    doc.value = (await api.admin.putDoc(props.docKey, doc.value)) as Record<string, unknown>
    message.value = '已保存，刷新站点即可看到'
    await reloadSite()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

/* —— 关于页联系方式 / 简历行的增删 —— */
function addContact() {
  about.value.contacts.push({ k: '', v: '' })
}
function removeContact(i: number) {
  about.value.contacts.splice(i, 1)
}
function addCvSection() {
  cv.value.sections.push({ label: '新板块', rows: [] })
}
function removeCvSection(i: number) {
  cv.value.sections.splice(i, 1)
}
function addCvRow(si: number) {
  cv.value.sections[si]?.rows.push({ k: '', v: '' })
}
function removeCvRow(si: number, ri: number) {
  cv.value.sections[si]?.rows.splice(ri, 1)
}

useHead(() => ({ title: `单页 · ${label.value}` }))
</script>

<template>
  <h1 class="admin-title">单页内容 · {{ label }}</h1>
  <p class="admin-sub">
    站点上所有不属于某一篇内容的文字都在这里——首页文案、关于与简历、栏目名称、
    首页导航，以及页眉按钮、面包屑、加载提示这类界面零碎。
    值里可以写行内 Markdown 与少量 HTML（<code>&lt;br&gt;</code>、
    <code>&lt;span class="light"&gt;</code> 会按站点样式渲染）。
  </p>

  <div class="btn-row" style="margin-top: 0; margin-bottom: 28px">
    <RouterLink v-for="tab in TABS" :key="tab.key" class="btn small"
                :class="{ primary: tab.key === docKey }"
                :to="{ name: 'admin-doc', params: { key: tab.key } }">{{ tab.label }}</RouterLink>
  </div>

  <p v-if="error" class="notice bad">{{ error }}</p>
  <p v-else-if="message" class="notice ok">{{ message }}</p>
  <p v-if="loading" class="loading-note">正在读取…</p>

  <form v-else-if="doc" @submit.prevent="save">
    <!-- ---------- 首页 ---------- -->
    <template v-if="docKey === 'home'">
      <div v-for="key in (['pro', 'personal'] as const)" :key="key" class="section-block">
        <h3>{{ key === 'pro' ? 'Professional · 专业一侧' : 'Personal · 个人一侧' }}</h3>
        <div class="field">
          <label>引言（大字）</label>
          <textarea v-model="home[key].lede" rows="3" style="font-family: var(--serif); font-size: 14.5px" />
          <span class="hint">用 *星号* 包住的词会显示成赭石色，和旧站的 &lt;em&gt; 一样。</span>
        </div>
        <div class="field">
          <label>小标题</label>
          <input v-model="home[key].nowLabel" type="text" />
        </div>
        <div class="field">
          <label>近况正文</label>
          <textarea v-model="home[key].now" rows="3" style="font-family: var(--serif); font-size: 14.5px" />
        </div>
      </div>
    </template>

    <!-- ---------- 关于我 ---------- -->
    <template v-else-if="docKey === 'about'">
      <div class="field-row">
        <div class="field"><label>页面标题</label><input v-model="about.title" type="text" /></div>
        <div class="field"><label>副标题</label><input v-model="about.subtitle" type="text" /></div>
      </div>
      <div class="field">
        <label>正文（Markdown，一段一行）</label>
        <textarea v-model="about.body" rows="8" />
      </div>
      <div class="field-row">
        <div class="field"><label>近况小标题</label><input v-model="about.nowLabel" type="text" /></div>
        <div class="field"><label>联系小标题</label><input v-model="about.contactLabel" type="text" /></div>
      </div>
      <div class="field">
        <label>近况正文（Markdown）</label>
        <textarea v-model="about.now" rows="3" />
      </div>

      <div class="section-block">
        <h3>联系方式</h3>
        <div v-for="(row, i) in about.contacts" :key="i" class="field-row">
          <div class="field"><label>名称</label><input v-model="row.k" type="text" /></div>
          <div class="field">
            <label>内容
              <button class="btn small danger" type="button" style="margin-left: 10px"
                      @click="removeContact(i)">删除</button>
            </label>
            <textarea v-model="row.v" rows="2" />
          </div>
        </div>
        <button class="btn small" type="button" @click="addContact">＋ 加一行</button>
      </div>
    </template>

    <!-- ---------- 简历 ---------- -->
    <template v-else-if="docKey === 'cv'">
      <div class="field-row">
        <div class="field"><label>页面标题</label><input v-model="cv.title" type="text" /></div>
        <div class="field"><label>副标题</label><input v-model="cv.subtitle" type="text" /></div>
      </div>
      <div v-for="(section, si) in cv.sections" :key="si" class="section-block">
        <h3>
          <input v-model="section.label" type="text"
                 style="font-family: inherit; font-size: 14px; font-weight: 600; letter-spacing: 0.08em;
                        border: none; border-bottom: 1px solid var(--line); background: none;
                        color: var(--ink); padding: 2px 0; width: 240px" />
          <button class="btn small danger" type="button" style="margin-left: 12px"
                  @click="removeCvSection(si)">删除板块</button>
        </h3>
        <div v-for="(row, ri) in section.rows" :key="ri" class="field-row">
          <div class="field"><label>左栏</label><input v-model="row.k" type="text" /></div>
          <div class="field">
            <label>右栏
              <button class="btn small danger" type="button" style="margin-left: 10px"
                      @click="removeCvRow(si, ri)">删除</button>
            </label>
            <textarea v-model="row.v" rows="2" />
          </div>
        </div>
        <button class="btn small" type="button" @click="addCvRow(si)">＋ 加一行</button>
      </div>
      <button class="btn" type="button" @click="addCvSection">＋ 加一个板块</button>
    </template>

    <!-- ---------- 栏目标题 ---------- -->
    <template v-else-if="docKey === 'sections'">
      <div v-for="(meta, key) in sections" :key="key" class="section-block">
        <h3>{{ key }}</h3>
        <div class="field"><label>栏目页大标题</label><input v-model="meta.title" type="text" /></div>
        <div class="field">
          <label>栏目页副标题</label>
          <textarea v-model="meta.subtitle" rows="2" style="font-family: var(--serif); font-size: 14.5px" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>短名称</label>
            <input v-model="meta.label" type="text" :placeholder="meta.title" />
            <span class="hint">面包屑和内页日期行里用的简称，留空就用大标题。</span>
          </div>
          <div class="field">
            <label>英文短名</label>
            <input v-model="meta.en" type="text" placeholder="Writing" />
            <span class="hint">面包屑右半边那个词，如「← 文章 · Writing」。</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ---------- 首页导航 ---------- -->
    <template v-else-if="docKey === 'nav'">
      <div v-for="key in (['pro', 'personal'] as const)" :key="key" class="section-block">
        <h3>{{ key === 'pro' ? 'Professional · 专业一侧' : 'Personal · 个人一侧' }}</h3>
        <NavRowsEditor :rows="nav[key]"
                       hint="「去哪」填站内路径，比如 /writing、/about#contact。填错只会跳到 404，不会弄坏别的。" />
      </div>
    </template>

    <!-- ---------- 界面文案 ---------- -->
    <template v-else-if="docKey === 'ui'">
      <div v-for="group in UI_GROUPS" :key="group.title" class="section-block">
        <h3>{{ group.title }}</h3>
        <p v-if="group.hint" class="hint" style="margin: -8px 0 16px">{{ group.hint }}</p>
        <div v-for="field in group.fields" :key="field.path" class="field">
          <label>{{ field.label }}</label>
          <textarea v-if="field.long" :value="uiValue(field.path)" rows="2"
                    style="font-family: var(--serif); font-size: 14.5px"
                    @input="setUiValue(field.path, $event)" />
          <input v-else :value="uiValue(field.path)" type="text"
                 @input="setUiValue(field.path, $event)" />
          <span v-if="field.hint" class="hint">{{ field.hint }}</span>
        </div>
      </div>

      <div class="section-block">
        <h3>404 页上的出口链接</h3>
        <NavRowsEditor :rows="ui.notFound.links" />
      </div>
    </template>

    <!-- ---------- 站点信息 ---------- -->
    <template v-else-if="docKey === 'site'">
      <div class="field-row">
        <div class="field"><label>站名（中文）</label><input v-model="site.siteName" type="text" /></div>
        <div class="field"><label>站名（英文）</label><input v-model="site.siteNameEn" type="text" /></div>
      </div>
      <div class="field">
        <label>默认描述（用于 SEO）</label>
        <textarea v-model="site.description" rows="3" style="font-family: var(--serif); font-size: 14.5px" />
      </div>
      <div class="field-row">
        <div class="field"><label>页脚左</label><input v-model="site.footerLeft" type="text" /></div>
        <div class="field"><label>页脚右</label><input v-model="site.footerRight" type="text" /></div>
      </div>
      <div class="field">
        <label>头像地址</label>
        <input v-model="site.avatar" type="text" />
        <span class="hint">默认 /avatar.png；也可以填后台上传得到的 /uploads/... 地址。</span>
      </div>
    </template>

    <div class="btn-row">
      <button class="btn primary" type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存' }}</button>
    </div>
  </form>
</template>
