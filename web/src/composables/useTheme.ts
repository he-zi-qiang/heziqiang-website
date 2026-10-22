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
  function apply() {
    const next = !isDark.value
    isDark.value = next
    if (next) root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch { /* 隐私模式下写不进去，无所谓 */ }
  }

  /**
   * 切换深浅色。传入按钮时，新配色从按钮所在的位置以圆形向外铺开；
   * 不支持 View Transitions 或要求减少动效时，退回到普通切换。
   */
  function toggle(from?: HTMLElement | null) {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> }
    }
    if (!from || !doc.startViewTransition || prefersReducedMotion()) {
      runWithTransition(apply)
      return
    }
    const rect = from.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    root.classList.add('vt-theme')
    const vt = doc.startViewTransition(apply)
    vt.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
    vt.finished.catch(() => {}).finally(() => root.classList.remove('vt-theme'))
  }
  return { isDark, toggle }
}
