import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'

export interface Heading {
  id: string
  text: string
  level: 2 | 3
}

/** 小标题文字 → 锚点 id：保留中英文和数字，其余连成短横线（和后端 slugify 同一思路） */
function slugOf(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  )
}

/** 滚动时判定「当前读到哪一节」：小标题越过视口顶部这条线就算进入 */
const ACTIVE_LINE = 120
const SPY_INTERVAL_MS = 80

/**
 * 正文（v-html 渲染）里的二、三级小标题：
 *  - 补上 id 和一个悬停才出现的「#」，点它复制这一节的链接；
 *  - 收集成列表交给宽屏右侧的目录，并跟着滚动标出当前所在的一节；
 *  - 带着 #小标题 打开的链接，等 id 补好后再滚过去（路由自己滚的时候 id 还不存在）。
 */
export function useArticleHeadings(body: Ref<HTMLElement | null>, html: Ref<string | undefined>, anchorTitle: Ref<string>) {
  const router = useRouter()
  const headings = ref<Heading[]>([])
  const activeId = ref<string | null>(null)

  function decorate() {
    const root = body.value
    if (!root) {
      headings.value = []
      return
    }
    const used = new Set<string>()
    const found: Heading[] = []
    root.querySelectorAll<HTMLHeadingElement>('h2, h3').forEach((el) => {
      // 标题文字里不算自己补进去的那个「#」
      const text = Array.from(el.childNodes)
        .filter((n) => !(n instanceof HTMLElement && n.classList.contains('heading-anchor')))
        .map((n) => n.textContent ?? '')
        .join('')
        .trim()
      let id = el.id || slugOf(text)
      for (let n = 2; used.has(id); n++) id = `${slugOf(text)}-${n}`
      used.add(id)
      el.id = id
      if (!el.querySelector('.heading-anchor')) {
        const a = document.createElement('a')
        a.className = 'heading-anchor'
        a.href = `#${encodeURIComponent(id)}`
        a.textContent = '#'
        el.appendChild(a)
      }
      const anchor = el.querySelector<HTMLAnchorElement>('.heading-anchor')!
      anchor.title = anchorTitle.value
      anchor.setAttribute('aria-label', `${anchorTitle.value}：${text}`)
      found.push({ id, text, level: el.tagName === 'H3' ? 3 : 2 })
    })
    headings.value = found
    spy()

    const hash = decodeURIComponent(location.hash.slice(1))
    if (hash && found.some((h) => h.id === hash)) document.getElementById(hash)?.scrollIntoView()
  }

  /** 跳到某一节：交给路由改地址栏的 #，滚动由路由的 scrollBehavior 负责；目录先跟着点的那一项亮起来 */
  function goTo(id: string) {
    activeId.value = id
    void router.replace({ hash: `#${id}` })
  }

  function onBodyClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('.heading-anchor')
    if (!anchor || !body.value?.contains(anchor)) return
    event.preventDefault()
    const id = anchor.parentElement?.id
    if (!id) return
    goTo(id)
    const url = `${location.origin}${location.pathname}#${encodeURIComponent(id)}`
    navigator.clipboard?.writeText(url).then(
      () => {
        anchor.textContent = '✓'
        setTimeout(() => (anchor.textContent = '#'), 1200)
      },
      () => {},
    )
  }

  let lastSpy = 0
  let trailing: ReturnType<typeof setTimeout> | undefined
  function spy() {
    const list = headings.value
    // 已经滚到底：最后几节的小标题再也到不了顶部那条线，直接算读到了最后一节
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    if (atBottom && window.scrollY > 0 && list.length) {
      activeId.value = list[list.length - 1]!.id
      return
    }
    let current: string | null = null
    for (const h of list) {
      const el = document.getElementById(h.id)
      if (el && el.getBoundingClientRect().top <= ACTIVE_LINE) current = h.id
    }
    activeId.value = current ?? list[0]?.id ?? null
  }
  function onScroll() {
    const now = Date.now()
    clearTimeout(trailing)
    if (now - lastSpy >= SPY_INTERVAL_MS) {
      lastSpy = now
      spy()
    } else {
      trailing = setTimeout(spy, SPY_INTERVAL_MS)
    }
  }

  watch(html, () => void nextTick(decorate), { flush: 'post' })
  watch(body, (el, old) => {
    old?.removeEventListener('click', onBodyClick)
    el?.addEventListener('click', onBodyClick)
    void nextTick(decorate)
  })
  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    body.value?.addEventListener('click', onBodyClick)
    void nextTick(decorate)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    body.value?.removeEventListener('click', onBodyClick)
    clearTimeout(trailing)
  })

  return { headings, activeId, goTo }
}
