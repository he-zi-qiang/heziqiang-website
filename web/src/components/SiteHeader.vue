<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMode, type Mode } from '@/composables/useMode'
import { useTheme, runWithTransition } from '@/composables/useTheme'
import { useSite } from '@/composables/useSite'

const route = useRoute()
const { mode, setMode } = useMode()
const { isDark, toggle } = useTheme()
const { bootstrap } = useSite()

const isHome = computed(() => route.meta.home === true)

/** 首页高亮跟着身份开关走，其余页面跟着页面所属的一侧走 */
const active = computed<Mode>(() =>
  isHome.value ? mode.value : ((route.meta.section as Mode | undefined) ?? 'pro'),
)

const siteName = computed(() => {
  const s = bootstrap.value?.site
  return s ? `${s.siteName} · ${s.siteNameEn}` : '何梓强 · He Ziqiang'
})
const avatar = computed(() => bootstrap.value?.site?.avatar || '/avatar.png')

function switchTo(next: Mode) {
  if (mode.value === next) return
  runWithTransition(() => setMode(next))
}
</script>

<template>
  <header class="site-head">
    <div class="site-id">
      <img :src="avatar" :alt="bootstrap?.site?.siteName ?? '头像'" />
      <span v-if="isHome" class="name">{{ siteName }}</span>
      <RouterLink v-else class="name" to="/">{{ siteName }}</RouterLink>
    </div>

    <div class="head-right">
      <!-- 首页是就地切换的开关；其余页面是回首页的链接 -->
      <nav v-if="isHome" class="mode-toggle" aria-label="身份切换">
        <span :class="{ on: active === 'pro' }" role="button" tabindex="0"
              @click="switchTo('pro')" @keydown.enter="switchTo('pro')">Professional</span>
        <span :class="{ on: active === 'personal' }" role="button" tabindex="0"
              @click="switchTo('personal')" @keydown.enter="switchTo('personal')">Personal</span>
      </nav>
      <nav v-else class="mode-toggle">
        <RouterLink :class="{ on: active === 'pro' }" :to="{ name: 'home', query: { mode: 'pro' } }">Professional</RouterLink>
        <RouterLink :class="{ on: active === 'personal' }" :to="{ name: 'home', query: { mode: 'personal' } }">Personal</RouterLink>
      </nav>

      <button class="theme-btn" type="button" aria-label="切换深浅色"
              :aria-pressed="isDark" :title="isDark ? '切换到明亮 · Light' : '切换到暗色 · Dark'"
              @click="toggle()">{{ isDark ? '◑' : '◐' }}</button>
    </div>
  </header>
</template>
