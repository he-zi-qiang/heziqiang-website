<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <p v-if="loading" class="loading-note">{{ ui.states.loading }}</p>
  <p v-else-if="error" class="error-note">{{ error }}</p>
  <p v-else-if="empty" class="loading-note">{{ emptyMessage }}</p>
</template>
