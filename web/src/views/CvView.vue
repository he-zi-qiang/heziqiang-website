<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import { useAsyncData } from '@/composables/useAsyncData'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'
import { textOf, useHead } from '@/composables/useHead'
import DefList from '@/components/DefList.vue'
import SiteCrumb from '@/components/SiteCrumb.vue'
import StateNote from '@/components/StateNote.vue'

const { data, error, loading } = useAsyncData(() => api.doc.cv())
const { bootstrap } = useSite()
const { ui } = useUi()

/** 模板里拿不到 window，包一层 */
function print() {
  window.print()
}

const description = computed(() => textOf(data.value?.introHtml) || bootstrap.value?.site?.description)

useHead(() => ({ title: data.value?.title, description: description.value }))
</script>

<template>
  <SiteCrumb mode="pro" />

  <StateNote :loading="loading" :error="error" />

  <template v-if="data">
    <!-- 标题块居左、证件照居右，像纸质简历的右上角；打印时页眉隐藏，身份一行负责交代是谁 -->
    <div class="cv-head" :class="{ 'has-portrait': !!data.portrait, 'has-intro': !!data.introHtml }">
      <div>
        <h1 class="page-title">{{ data.title }}</h1>
        <p class="page-sub">
          {{ data.subtitle }}
          <span class="sep no-print" style="margin: 0 10px">·</span>
          <a class="no-print" href="#" style="border-bottom: 1px solid var(--line)"
             @click.prevent="print()">{{ ui.cv.printLabel }}</a>
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -- 内容只来自本人后台 -->
        <p v-if="data.introHtml" class="cv-intro" v-html="data.introHtml"></p>
      </div>
      <figure v-if="data.portrait" class="portrait">
        <img :src="data.portrait" :alt="bootstrap?.site?.siteName ?? ''" />
      </figure>
    </div>

    <div v-for="section in data.sections" :key="section.label">
      <div class="smallcaps section-label">{{ section.label }}</div>
      <DefList :rows="section.rows" />
    </div>
  </template>
</template>
