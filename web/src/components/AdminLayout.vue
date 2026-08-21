<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { user, logout } = useAuth()
const { isDark, toggle } = useTheme()

async function signOut() {
  await logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <div class="admin-shell">
    <div class="admin-bar">
      <span class="brand">写作台</span>
      <nav class="admin-nav">
        <RouterLink :to="{ name: 'admin-home' }">概览</RouterLink>
        <RouterLink :to="{ name: 'admin-entries' }">内容</RouterLink>
        <RouterLink :to="{ name: 'admin-photos' }">照片</RouterLink>
        <RouterLink :to="{ name: 'admin-doc', params: { key: 'home' } }">单页</RouterLink>
        <RouterLink :to="{ name: 'admin-account' }">账号</RouterLink>
        <a href="/" target="_blank" rel="noopener">看站点 ↗</a>
      </nav>
      <span class="spacer" />
      <span class="who">{{ user?.displayName ?? '' }}</span>
      <button class="btn small" type="button" @click="toggle()">{{ isDark ? '◑' : '◐' }}</button>
      <button class="btn small" type="button" @click="signOut">退出</button>
    </div>
    <div class="admin-main">
      <slot />
    </div>
  </div>
</template>
