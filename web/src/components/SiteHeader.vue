<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMode, type Mode } from '@/composables/useMode'
import { useTheme, runWithTransition } from '@/composables/useTheme'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'

const route = useRoute()
const router = useRouter()
const { mode, setMode } = useMode()
const { isDark, toggle } = useTheme()
const { bootstrap } = useSite()
const { ui } = useUi()

const isHome = computed(() => route.meta.home === true)

/** 首页高亮跟着身份开关走，其余页面跟着页面所属的一侧走 */
const active = computed<Mode>(() =>
  isHome.value ? mode.value : ((route.meta.section as Mode | undefined) ?? 'pro'),
)

const siteName = computed(() => {
  const s = bootstrap.value?.site
  return s ? [s.siteName, s.siteNameEn].filter(Boolean).join(' · ') : ''
})
const avatar = computed(() => bootstrap.value?.site?.avatar || '/avatar.png')
const themeTitle = computed(() => (isDark.value ? ui.value.header.toLight : ui.value.header.toDark))

function switchTo(next: Mode) {
  if (mode.value === next) return
  runWithTransition(() => setMode(next))
  // 地址栏里残留的 ?mode= 会和刚切的那一侧打架（刷新又切回去），切换后去掉它，交给本地记忆
  if (route.query.mode) void router.replace({ query: {} })
}
</script>

<template>
  <header class="site-head">
    <div class="site-id">
      <img :src="avatar" :alt="bootstrap?.site?.siteName ?? ''" />
      <span v-if="isHome" class="name">{{ siteName }}</span>
      <RouterLink v-else class="name" to="/">{{ siteName }}</RouterLink>
    </div>

    <div class="head-right">
      <!-- 首页是就地切换的开关；其余页面是回首页的链接 -->
      <nav v-if="isHome" class="mode-toggle" :aria-label="ui.header.switchAria">
        <button type="button" :class="{ on: active === 'pro' }" :aria-pressed="active === 'pro'"
                @click="switchTo('pro')">{{ ui.header.proLabel }}</button>
        <button type="button" :class="{ on: active === 'personal' }" :aria-pressed="active === 'personal'"
                @click="switchTo('personal')">{{ ui.header.personalLabel }}</button>
      </nav>
      <nav v-else class="mode-toggle" :aria-label="ui.header.switchAria">
        <RouterLink :class="{ on: active === 'pro' }" :to="{ name: 'home', query: { mode: 'pro' } }">
          {{ ui.header.proLabel }}
        </RouterLink>
        <RouterLink :class="{ on: active === 'personal' }" :to="{ name: 'home', query: { mode: 'personal' } }">
          {{ ui.header.personalLabel }}
        </RouterLink>
      </nav>

      <button class="theme-btn" type="button" :aria-label="ui.header.themeAria"
              :aria-pressed="isDark" :title="themeTitle"
              @click="toggle()">{{ isDark ? '◑' : '◐' }}</button>
    </div>
  </header>
</template>
