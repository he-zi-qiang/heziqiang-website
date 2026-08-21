<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/api/client'
import type { Photo } from '@/api/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'

const { data, error, loading, reload } = useAsyncData(() => api.admin.photos())
const library = useAsyncData(() => api.admin.uploads())

const busy = ref<number | null>(null)
const message = ref<string | null>(null)
const uploading = ref(false)
const pickerFor = ref<number | null>(null)

async function upload(event: Event, photo: Photo) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  message.value = null
  try {
    const result = await api.admin.upload(file)
    await api.admin.updatePhoto(photo.id, { url: result.url })
    await Promise.all([reload(), library.reload()])
    message.value = `已上传 ${result.filename}`
  } catch (err) {
    message.value = (err as Error).message
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function patch(photo: Photo, body: Partial<Photo>) {
  busy.value = photo.id
  try {
    await api.admin.updatePhoto(photo.id, body)
    await reload()
  } catch (err) {
    message.value = (err as Error).message
  } finally {
    busy.value = null
  }
}

async function pick(photo: Photo, url: string) {
  pickerFor.value = null
  await patch(photo, { url })
}

async function add() {
  try {
    const created = await api.admin.createPhoto({
      url: '',
      caption: '新照片',
      whenLabel: '',
      sortIndex: (data.value?.items.length ?? 0),
    })
    await reload()
    message.value = `已新增一格（#${created.id}）`
  } catch (err) {
    message.value = (err as Error).message
  }
}

async function remove(photo: Photo) {
  if (!confirm('确定删除这一格？')) return
  busy.value = photo.id
  try {
    await api.admin.deletePhoto(photo.id)
    await reload()
  } catch (err) {
    message.value = (err as Error).message
  } finally {
    busy.value = null
  }
}

useHead(() => ({ title: '照片' }))
</script>

<template>
  <h1 class="admin-title">照片</h1>
  <p class="admin-sub">
    摄影页的每一格。上传会存到服务器的 uploads 目录，站点通过 /uploads/… 访问；
    也可以从下面已上传过的图里直接挑一张。
  </p>

  <p v-if="message" class="notice ok">{{ message }}</p>

  <div class="btn-row" style="margin-top: 0; margin-bottom: 24px">
    <button class="btn primary" type="button" @click="add">＋ 新增一格</button>
    <span v-if="uploading" style="font-size: 13px; color: var(--muted)">上传中…</span>
  </div>

  <StateNote :loading="loading" :error="error" :empty="!loading && data?.items.length === 0"
             empty-text="还没有照片。" />

  <div v-if="data?.items.length" class="photo-admin-grid">
    <div v-for="photo in data.items" :key="photo.id" class="photo-card">
      <div class="thumb">
        <img v-if="photo.url" :src="photo.url" :alt="photo.alt" />
        <span v-else>未设置图片</span>
      </div>
      <div class="body">
        <div class="field">
          <label>时间</label>
          <input :value="photo.whenLabel" type="text" placeholder="2026 · 5"
                 @change="patch(photo, { whenLabel: ($event.target as HTMLInputElement).value })" />
        </div>
        <div class="field">
          <label>说明</label>
          <textarea :value="photo.caption" rows="2" style="font-family: var(--serif); font-size: 14px"
                    @change="patch(photo, { caption: ($event.target as HTMLTextAreaElement).value })" />
        </div>

        <div v-if="pickerFor === photo.id" class="upload-strip">
          <button v-for="item in library.data.value?.items ?? []" :key="item.url" type="button"
                  :title="item.name" @click="pick(photo, item.url)">
            <img :src="item.url" :alt="item.name" />
          </button>
          <span v-if="!library.data.value?.items.length" style="font-size: 12.5px; color: var(--faint)">
            还没有上传过图片
          </span>
        </div>

        <div class="btn-row" style="margin-top: 0">
          <label class="btn small" style="cursor: pointer">
            上传
            <input type="file" accept="image/*" hidden @change="upload($event, photo)" />
          </label>
          <button class="btn small" type="button"
                  @click="pickerFor = pickerFor === photo.id ? null : photo.id">选已有</button>
          <button v-if="photo.url" class="btn small" type="button" :disabled="busy === photo.id"
                  @click="patch(photo, { url: '' })">清空</button>
          <button class="btn small danger" type="button" :disabled="busy === photo.id"
                  @click="remove(photo)">删</button>
        </div>
      </div>
    </div>
  </div>
</template>
