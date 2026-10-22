import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { prefetch, publicPath } from '@/api/client'
import type { EntryKind } from '@/api/types'

/** 一个站内地址打开后要用到的公开接口；对不上任何页面（后台、站外）就是空的 */
function dataPathsFor(router: Router, href: string): string[] {
  const route = router.resolve(href)
  const name = String(route.name ?? '')
  if (name === 'about') return [publicPath.about]
  if (name === 'cv') return [publicPath.cv]
  if (name === 'photos') return [publicPath.photos]
  if (name.startsWith('list-')) return [publicPath.entries(name.slice('list-'.length) as EntryKind)]
  if (name.startsWith('detail-')) return [publicPath.entry(String(route.params.slug))]
  return []
}

function internalHref(target: EventTarget | null): string | null {
  const anchor = (target as HTMLElement | null)?.closest?.('a')
  const href = anchor?.getAttribute('href')
  return href && href.startsWith('/') && !href.startsWith('//') ? href : null
}

/** 浏览器空闲时再做，不跟首屏渲染抢时间 */
function whenIdle(fn: () => void) {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback
  if (ric) ric(fn, { timeout: 2000 })
  else setTimeout(fn, 300)
}

/** 每页预取的链接上限：这个站一页的站内链接本来就不多，封顶只是保险 */
const IDLE_PREFETCH_LIMIT = 12

/**
 * 站内链接的两件事：
 *
 * 1. v-html 渲染出来的正文里也会有站内链接（简历里指向项目页的那种）。
 *    它们是普通 <a>，点了会整页刷新。这里做一层事件委托，把同源链接交给路由，
 *    同时放过新窗口、下载、锚点和带修饰键的点击。
 *    RouterLink 自己会先 preventDefault，冒泡到这里时 defaultPrevented 已经为真，不会重复处理。
 *
 * 2. 预取：鼠标停到（或手指按到、键盘移到）站内链接上就把目标页的数据先取回来；
 *    每进一页，再趁空闲把这一页上能点的链接都预取一遍——手机上没有悬停，靠的是这一条。
 */
export function useInternalLinks() {
  const router = useRouter()

  function prefetchHref(href: string | null) {
    if (!href) return
    for (const path of dataPathsFor(router, href)) prefetch(path)
  }

  function onClick(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const anchor = (event.target as HTMLElement | null)?.closest('a')
    if (!anchor) return
    if (anchor.target && anchor.target !== '_self') return
    if (anchor.hasAttribute('download') || anchor.getAttribute('rel')?.includes('external')) return

    const href = anchor.getAttribute('href')
    if (!href || !href.startsWith('/') || href.startsWith('//')) return

    event.preventDefault()
    void router.push(href)
  }

  // pointerover 在同一个链接里移动时会连发，同一个地址只处理一次
  let lastHref: string | null = null
  function onIntent(event: Event) {
    const href = internalHref(event.target)
    if (!href || href === lastHref) return
    lastHref = href
    prefetchHref(href)
  }

  const stopAfterEach = router.afterEach(() => {
    whenIdle(() => {
      const links = document.querySelectorAll<HTMLAnchorElement>('main a[href^="/"]')
      Array.from(links)
        .slice(0, IDLE_PREFETCH_LIMIT)
        .forEach((a) => prefetchHref(a.getAttribute('href')))
    })
  })

  onMounted(() => {
    document.addEventListener('click', onClick)
    document.addEventListener('pointerover', onIntent, { passive: true })
    document.addEventListener('pointerdown', onIntent, { passive: true })
    document.addEventListener('focusin', onIntent)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('pointerover', onIntent)
    document.removeEventListener('pointerdown', onIntent)
    document.removeEventListener('focusin', onIntent)
    stopAfterEach()
  })
}
