<script setup lang="ts">
import { computed } from 'vue'
import { useMode } from '@/composables/useMode'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'
import { useHead } from '@/composables/useHead'
import StateNote from '@/components/StateNote.vue'

const { mode } = useMode()
const { bootstrap, error } = useSite()
const { nav } = useUi()

const home = computed(() => bootstrap.value?.home ?? null)
const side = computed(() => (home.value ? home.value[mode.value] : null))
const rows = computed(() => nav.value[mode.value] ?? [])

useHead(() => ({ title: null, description: bootstrap.value?.site?.description }))
</script>

<template>
  <StateNote :loading="!home && !error" :error="error" />

  <section v-if="side" :key="mode" class="mode-enter">
    <!-- eslint-disable-next-line vue/no-v-html -- 只有本人后台能写 -->
    <p class="lede" v-html="side.ledeHtml"></p>

    <div class="smallcaps section-label">{{ side.nowLabel }}</div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p class="now" v-html="side.nowHtml"></p>

    <nav class="index-nav">
      <RouterLink v-for="row in rows" :key="row.to" class="index-row" :to="row.to">
        <span>{{ row.zh }}</span><span class="en">{{ row.en }}</span>
      </RouterLink>
    </nav>
  </section>
</template>
