<script setup lang="ts">
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { textOf, useHead } from '@/composables/useHead'
import DefList from '@/components/DefList.vue'
import SiteCrumb from '@/components/SiteCrumb.vue'
import StateNote from '@/components/StateNote.vue'
import TwoCol from '@/components/TwoCol.vue'

const { data, error, loading } = useAsyncData(() => api.doc.about())

useHead(() => ({ title: data.value?.title, description: textOf(data.value?.bodyHtml) }))
</script>

<template>
  <SiteCrumb mode="pro" />

  <StateNote :loading="loading" :error="error" />

  <TwoCol v-if="data">
    <h1 class="page-title">{{ data.title }}</h1>
    <p class="page-sub">{{ data.subtitle }}</p>

    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="article-body" v-html="data.bodyHtml"></div>

    <div class="smallcaps section-label" style="margin-top: 24px">{{ data.nowLabel }}</div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="article-body" v-html="data.nowHtml"></div>

    <!-- 联系方式：宽屏放在右栏 -->
    <div id="contact" class="only-narrow" style="margin-top: 56px">
      <div class="smallcaps section-label">{{ data.contactLabel }}</div>
      <DefList :rows="data.contacts" />
    </div>

    <template #aside>
      <div class="smallcaps section-label">{{ data.contactLabel }}</div>
      <DefList class="compact" :rows="data.contacts" />
    </template>
  </TwoCol>
</template>
