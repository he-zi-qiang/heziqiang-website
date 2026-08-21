<script setup lang="ts">
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useHead } from '@/composables/useHead'
import DefList from '@/components/DefList.vue'
import StateNote from '@/components/StateNote.vue'

const { data, error, loading } = useAsyncData(() => api.doc.about())

useHead(() => ({ title: data.value?.title, description: data.value?.body?.slice(0, 120) }))
</script>

<template>
  <div class="crumb"><RouterLink :to="{ path: '/', query: { mode: 'pro' } }">← 索引 · Index</RouterLink></div>

  <StateNote :loading="loading" :error="error" />

  <template v-if="data">
    <h1 class="page-title">{{ data.title }}</h1>
    <p class="page-sub">{{ data.subtitle }}</p>

    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="article-body" v-html="data.bodyHtml"></div>

    <div class="smallcaps section-label" style="margin-top: 24px">{{ data.nowLabel }}</div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="article-body" v-html="data.nowHtml"></div>

    <div id="contact" class="smallcaps section-label" style="margin-top: 56px">{{ data.contactLabel }}</div>
    <DefList :rows="data.contacts" />
  </template>
</template>
