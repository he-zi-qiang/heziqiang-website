<script setup lang="ts">
defineProps<{ loading?: boolean; error?: string | null; empty?: boolean; emptyText?: string }>()
</script>

<template>
  <p v-if="loading" class="loading-note">正在取内容…</p>
  <p v-else-if="error" class="error-note">{{ error }}</p>
  <p v-else-if="empty" class="loading-note">{{ emptyText ?? '这里还什么都没有。' }}</p>
</template>
