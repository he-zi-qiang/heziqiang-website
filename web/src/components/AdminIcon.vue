<script setup lang="ts">
/** 后台侧栏与按钮用的线条小图标，跟着文字颜色走 */
defineProps<{
  name: 'overview' | 'entries' | 'photos' | 'pages' | 'account' | 'site' | 'logout' | 'moon' | 'sun' | 'plus'
}>()
</script>

<template>
  <svg class="admin-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="name === 'overview'">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </template>
    <template v-else-if="name === 'entries'">
      <path d="M7 3.5h7l4.5 4.5v12a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M14 3.5V8h4.5M9.5 12.5h6M9.5 16h6" />
    </template>
    <template v-else-if="name === 'photos'">
      <rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" />
      <path d="m20.5 15.5-4.5-4.5-8.5 8" />
    </template>
    <template v-else-if="name === 'pages'">
      <path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h9" />
    </template>
    <template v-else-if="name === 'account'">
      <circle cx="12" cy="8.5" r="3.75" /><path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
    </template>
    <template v-else-if="name === 'site'">
      <path d="M13.5 4.5h6v6M19.5 4.5l-8 8M17.5 14v5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M14.5 4.5h4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4M10 16.5l4.5-4.5L10 7.5M14.5 12H4" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
  </svg>
</template>
