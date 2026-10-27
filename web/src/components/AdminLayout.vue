<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import { useSite } from '@/composables/useSite'
import AdminIcon from './AdminIcon.vue'

const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()
const { isDark, toggle } = useTheme()
const { bootstrap } = useSite()

const avatar = computed(() => bootstrap.value?.site?.avatar || '/avatar.png')

/** 侧栏的几项。编辑某一篇时「内容」仍然亮着，切到任何一张单页时「单页」亮着 */
const NAV = [
  { label: '概览', icon: 'overview', to: { name: 'admin-home' }, names: ['admin-home'] },
  { label: '内容', icon: 'entries', to: { name: 'admin-entries' },
    names: ['admin-entries', 'admin-entry-new', 'admin-entry-edit'] },
  { label: '照片', icon: 'photos', to: { name: 'admin-photos' }, names: ['admin-photos'] },
  { label: '单页', icon: 'pages', to: { name: 'admin-doc', params: { key: 'home' } }, names: ['admin-doc'] },
  { label: '账号', icon: 'account', to: { name: 'admin-account' }, names: ['admin-account'] },
] as const

function isActive(names: readonly string[]) {
  return names.includes(String(route.name))
}

async function signOut() {
  await logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-side">
      <RouterLink class="admin-brand" :to="{ name: 'admin-home' }">
        <img :src="avatar" alt="" />
        <span class="brand-text">
          <span class="brand-name">写作台</span>
          <span class="brand-sub">{{ bootstrap?.site?.siteName ?? '' }}</span>
        </span>
      </RouterLink>

      <nav class="admin-nav">
        <RouterLink v-for="item in NAV" :key="item.label" :to="item.to"
                    :class="{ on: isActive(item.names) }" :aria-current="isActive(item.names) ? 'page' : undefined">
          <AdminIcon :name="item.icon" />{{ item.label }}
        </RouterLink>
        <a href="/" target="_blank" rel="noopener"><AdminIcon name="site" />看站点</a>
      </nav>

      <div class="admin-me">
        <span class="who">{{ user?.displayName ?? '' }}</span>
        <button class="icon-btn" type="button" :title="isDark ? '切换到明亮' : '切换到暗色'"
                :aria-label="isDark ? '切换到明亮' : '切换到暗色'" @click="toggle()">
          <AdminIcon :name="isDark ? 'sun' : 'moon'" />
        </button>
        <button class="icon-btn" type="button" title="退出" aria-label="退出" @click="signOut">
          <AdminIcon name="logout" />
        </button>
      </div>
    </aside>

    <!-- 不用 <main>：站点样式里 main 有宽屏网格定位和入场动效，会串到后台来 -->
    <div class="admin-main">
      <slot />
    </div>
  </div>
</template>
