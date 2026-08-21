import { ref } from 'vue'

const THEME_KEY = 'hz-theme'
const root = document.documentElement

/** 深浅色。初值由 index.html 里的首屏脚本决定，这里只负责后续切换 */
const isDark = ref(root.getAttribute('data-theme') === 'dark')

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** 用 View Transitions 做整页交叉淡入；不支持或用户要求减少动效时直接切 */
export function runWithTransition(apply: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (doc.startViewTransition && !prefersReducedMotion()) {
    const vt = doc.startViewTransition(apply) as { finished?: Promise<void>; ready?: Promise<void> }
    vt?.finished?.catch(() => {})
    vt?.ready?.catch(() => {})
  } else {
    apply()
  }
}

export function useTheme() {
  function toggle() {
    runWithTransition(() => {
      const next = !isDark.value
      isDark.value = next
      if (next) root.setAttribute('data-theme', 'dark')
      else root.removeAttribute('data-theme')
      try {
        localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
      } catch { /* 隐私模式下写不进去，无所谓 */ }
    })
  }
  return { isDark, toggle }
}
