import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * v-html 渲染出来的正文里也会有站内链接（简历里指向项目页的那种）。
 * 它们是普通 <a>，点了会整页刷新。这里做一层事件委托，把同源链接交给路由，
 * 同时放过新窗口、下载、锚点和带修饰键的点击。
 * RouterLink 自己会先 preventDefault，冒泡到这里时 defaultPrevented 已经为真，不会重复处理。
 */
export function useInternalLinks() {
  const router = useRouter()

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

  onMounted(() => document.addEventListener('click', onClick))
  onBeforeUnmount(() => document.removeEventListener('click', onClick))
}
