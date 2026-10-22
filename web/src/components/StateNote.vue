<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useUi } from '@/composables/useUi'

const props = defineProps<{
  loading?: boolean
  error?: string | null
  empty?: boolean
  /** 空列表时显示什么，不传就用「界面文案」里的通用那句 */
  emptyText?: string
}>()

const { ui } = useUi()
const emptyMessage = computed(() => props.emptyText || ui.value.states.emptyList)

/**
 * 「正在取内容…」晚一点再露面：大多数时候数据一眨眼就到（或者早就在缓存里），
 * 字一闪而过反而像出了故障。占位的高度一直在，版面不会跳。
 */
const LOADING_DELAY_MS = 300
const showLoading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.loading,
  (loading) => {
    clearTimeout(timer)
    showLoading.value = false
    if (loading) timer = setTimeout(() => (showLoading.value = true), LOADING_DELAY_MS)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <p v-if="loading" class="loading-note" :class="{ quiet: !showLoading }">{{ ui.states.loading }}</p>
  <p v-else-if="error" class="error-note">{{ error }}</p>
  <p v-else-if="empty" class="loading-note">{{ emptyMessage }}</p>
</template>
