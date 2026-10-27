<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMode, type Mode } from '@/composables/useMode'
import { useTheme, runWithTransition } from '@/composables/useTheme'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'
import { useNavRows } from '@/composables/useNavRows'

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

/**
 * 宽屏左栏的栏目导航：跟着当前高亮的一侧走，所在栏目（含其中的文章）标成当前项。
 * 「联系」这种带 # 的行（/about#contact）只在地址也带着这个 # 时算当前项，这时「关于我」让出来
 */
const navRows = useNavRows(active)
function matches(to: string) {
  const [path, hash] = to.split('#') as [string, string | undefined]
  const pathOk = path !== '/' && (route.path === path || route.path.startsWith(`${path}/`))
  return hash ? pathOk && route.hash === `#${hash}` : pathOk
}
function isCurrent(to: string) {
  if (!matches(to)) return false
  return to.includes('#') || !navRows.value.some((row) => row.to.includes('#') && matches(row.to))
}

const site = computed(() => bootstrap.value?.site ?? null)
const avatar = computed(() => bootstrap.value?.site?.avatar || '/avatar.png')
const themeTitle = computed(() => (isDark.value ? ui.value.header.toLight : ui.value.header.toDark))

/**
 * 身份切换是一个分段开关，当前那一侧底下垫着一块会滑过去的白色滑块。
 * 支持 View Transitions 的浏览器里它带着自己的过渡名，切换（含换页）时由过渡负责滑动；
 * 其余浏览器靠 CSS transition。位置按当前高亮那一项的实际宽度算，字体加载完、窗口变化时重算。
 */
const toggleEl = ref<HTMLElement | null>(null)
const indicator = ref<{ left: number; width: number } | null>(null)

function measure() {
  const on = toggleEl.value?.querySelector<HTMLElement>('.on')
  indicator.value = on ? { left: on.offsetLeft, width: on.offsetWidth } : null
}
watch([active, isHome], () => void nextTick(measure), { flush: 'post' })
onMounted(() => {
  measure()
  document.fonts?.ready.then(measure).catch(() => {})
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))

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
      <img :src="avatar" :alt="site?.siteName ?? ''" />
      <!-- 中文名在上、英文名在下；首页不链回自己 -->
      <component :is="isHome ? 'span' : 'RouterLink'" class="names" :to="isHome ? undefined : '/'">
        <span class="name">{{ site?.siteName }}</span>
        <span v-if="site?.siteNameEn" class="name-en">{{ site.siteNameEn }}</span>
      </component>
    </div>

    <!-- 栏目导航和文章目录只在宽屏的左栏里出现；窄屏首页的索引在正文最后，内页靠面包屑 -->
    <nav class="rail-nav">
      <RouterLink v-for="row in navRows" :key="row.to" :to="row.to"
                  :class="{ on: isCurrent(row.to) }" :aria-current="isCurrent(row.to) ? 'page' : undefined">
        <span>{{ row.zh }}</span><span v-if="row.count" class="count">{{ row.count }}</span>
      </RouterLink>
    </nav>
    <div id="rail-toc" class="rail-toc"></div>

    <div class="head-right">
      <!-- 首页是就地切换的开关；其余页面是回首页的链接 -->
      <nav v-if="isHome" ref="toggleEl" class="mode-toggle" :aria-label="ui.header.switchAria">
        <button type="button" :class="{ on: active === 'pro' }" :aria-pressed="active === 'pro'"
                @click="switchTo('pro')">{{ ui.header.proLabel }}</button>
        <button type="button" :class="{ on: active === 'personal' }" :aria-pressed="active === 'personal'"
                @click="switchTo('personal')">{{ ui.header.personalLabel }}</button>
        <span v-if="indicator" class="toggle-indicator" aria-hidden="true"
              :style="{ width: `${indicator.width}px`, transform: `translateX(${indicator.left}px)` }"></span>
      </nav>
      <nav v-else ref="toggleEl" class="mode-toggle" :aria-label="ui.header.switchAria">
        <RouterLink :class="{ on: active === 'pro' }" :to="{ name: 'home', query: { mode: 'pro' } }">
          {{ ui.header.proLabel }}
        </RouterLink>
        <RouterLink :class="{ on: active === 'personal' }" :to="{ name: 'home', query: { mode: 'personal' } }">
          {{ ui.header.personalLabel }}
        </RouterLink>
        <span v-if="indicator" class="toggle-indicator" aria-hidden="true"
              :style="{ width: `${indicator.width}px`, transform: `translateX(${indicator.left}px)` }"></span>
      </nav>

      <button class="theme-btn" type="button" :aria-label="ui.header.themeAria"
              :aria-pressed="isDark" :title="themeTitle"
              @click="toggle($event.currentTarget as HTMLElement)">
        <!-- 暗色下显示太阳（点了回到明亮），明亮下显示月亮 -->
        <svg v-if="isDark" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      </button>
    </div>
  </header>
</template>
