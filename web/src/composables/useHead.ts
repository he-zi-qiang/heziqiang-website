import { watchEffect } from 'vue'

const DEFAULT_TITLE = '何梓强 · He Ziqiang'

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * 单页应用没有服务端渲染，标题和描述得自己维护。
 * 传 getter 而不是值，数据到达后会自动更新。
 */
export function useHead(get: () => { title?: string | null; description?: string | null }) {
  watchEffect(() => {
    const { title, description } = get()
    document.title = title ? `${title} · 何梓强` : DEFAULT_TITLE
    if (description) setMeta('description', description)
  })
}

export function resetHead() {
  document.title = DEFAULT_TITLE
}
