import { nextTick } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'

type ViewTransition = { finished: Promise<void>; ready: Promise<void> }
type DocWithVT = Document & { startViewTransition?: (update: () => Promise<void> | void) => ViewTransition }

/** 列表里那一行的标题 ↔ 文章页的大标题，共用这个过渡名，换页时标题会从原位置「飞」过去 */
const TITLE_NAME = 'entry-title'
/** 浏览器迟迟不给渲染帧（比如后台标签页）时，最多等这么久就照常放行导航 */
const RELEASE_AFTER_MS = 300

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** 当前页面上指向某个地址的那一行标题（列表页的 .e-title、首页「最近」的 .r-title） */
function titleLinkedTo(router: Router, path: string): HTMLElement | null {
  for (const a of document.querySelectorAll<HTMLAnchorElement>('main a[href^="/"]')) {
    const title = a.querySelector<HTMLElement>('.e-title, .r-title')
    if (title && router.resolve(a.getAttribute('href')!).path === path) return title
  }
  return null
}

function clearTitleNames() {
  document.querySelectorAll<HTMLElement>('.e-title, .r-title').forEach((el) => {
    el.style.removeProperty('view-transition-name')
  })
}

function wantsTransition(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  if (!from.matched.length) return false // 进站第一屏有自己的入场动效
  if (to.path === from.path) return false // 只改了 # 或参数：锚点跳转、身份切换
  if (to.meta.layout === 'admin' || from.meta.layout === 'admin') return false
  return !reducedMotion()
}

/**
 * 站内换页用 View Transitions 做交叉淡入（不支持的浏览器照旧用 style.css 里 main 的入场动效）。
 * 从列表点进文章时，被点的那一行标题会变形成文章页的大标题；从文章返回列表时再变回去。
 *
 * 做法：beforeResolve 里开始过渡，等路由换完、新页面渲染好（afterEach + nextTick）再结束更新回调。
 */
export function installPageTransitions(router: Router) {
  const doc = document as DocWithVT
  if (!doc.startViewTransition) return

  let finishUpdate: (() => void) | null = null

  router.beforeResolve((to, from) => {
    if (!wantsTransition(to, from)) return

    return new Promise<void>((releaseNav) => {
      let released = false
      const release = () => {
        if (released) return
        released = true
        releaseNav()
      }
      const timer = setTimeout(release, RELEASE_AFTER_MS)

      // 旧画面：要去的那篇文章在当前列表里的标题
      clearTitleNames()
      titleLinkedTo(router, to.path)?.style.setProperty('view-transition-name', TITLE_NAME)
      document.documentElement.classList.add('vt-nav')

      const vt = doc.startViewTransition!(() => {
        clearTimeout(timer)
        // 已经因为超时放行过导航：新页面早就渲染了，这次直接结束，别把页面冻住
        if (released) {
          document.querySelector('main')?.classList.add('vt-entered')
          return
        }
        return new Promise<void>((done) => {
          finishUpdate = () => {
            // 新画面：刚离开的那篇文章在这个列表里的标题（返回列表时标题飞回原位）
            clearTitleNames()
            titleLinkedTo(router, from.path)?.style.setProperty('view-transition-name', TITLE_NAME)
            // 这一页已经由过渡淡入了：打上标记，过渡结束摘掉 vt-nav 时 main 不再从透明重新浮起一遍（那一下就是闪）
            document.querySelector('main')?.classList.add('vt-entered')
            done()
          }
          release()
        })
      })
      vt.ready.catch(() => {})
      vt.finished
        .catch(() => {})
        .finally(() => {
          clearTitleNames()
          document.documentElement.classList.remove('vt-nav')
        })
    })
  })

  router.afterEach(async () => {
    const finish = finishUpdate
    finishUpdate = null
    if (!finish) return
    await nextTick()
    finish()
  })
}
