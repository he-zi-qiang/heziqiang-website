<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/api/client'

/**
 * 后台选一张图：可以直接填地址，也可以上传新图，或从已上传过的图里挑。
 * 页眉头像、首页形象照、简历证件照都用它；值永远是一个站内地址（/uploads/... 或 /avatar.png）。
 */
defineProps<{
  label: string
  hint?: string
  /** 头像这类圆形展示的图，缩略图也画成圆 */
  round?: boolean
}>()

const model = defineModel<string>({ required: true })

const uploading = ref(false)
const error = ref<string | null>(null)
const showLibrary = ref(false)
const library = ref<{ url: string; name: string }[] | null>(null)

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  error.value = null
  try {
    const result = await api.admin.upload(file)
    model.value = result.url
    library.value = null // 库里多了一张，下次打开重新取
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function toggleLibrary() {
  showLibrary.value = !showLibrary.value
  if (!showLibrary.value || library.value) return
  try {
    library.value = (await api.admin.uploads()).items
  } catch (err) {
    error.value = (err as Error).message
  }
}

function pick(url: string) {
  model.value = url
  showLibrary.value = false
}
</script>

<template>
  <div class="field">
    <label>{{ label }}</label>
    <div class="image-picker">
      <div class="thumb" :class="{ round }">
        <img v-if="model" :src="model" alt="" />
        <span v-else>未设置</span>
      </div>
      <div class="ops">
        <input v-model="model" type="text" placeholder="/uploads/… 或 /avatar.png" />
        <div class="btn-row">
          <label class="btn small">
            上传
            <input type="file" accept="image/*" hidden @change="upload" />
          </label>
          <button class="btn small" type="button" @click="toggleLibrary">选已有</button>
          <button v-if="model" class="btn small" type="button" @click="model = ''">清空</button>
          <span v-if="uploading" class="hint">上传中…</span>
          <span v-if="error" class="hint bad">{{ error }}</span>
        </div>
        <div v-if="showLibrary" class="upload-strip">
          <button v-for="item in library ?? []" :key="item.url" type="button" :title="item.name"
                  @click="pick(item.url)">
            <img :src="item.url" :alt="item.name" />
          </button>
          <span v-if="library && !library.length" class="hint">还没有上传过图片</span>
        </div>
      </div>
    </div>
    <span v-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>
