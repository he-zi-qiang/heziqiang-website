import { watchEffect } from 'vue'
import { useSite } from './useSite'

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
 * 站名与默认描述都取自后台的「站点信息」。
 */
export function useHead(get: () => { title?: string | null; description?: string | null }) {
  const { bootstrap } = useSite()

  watchEffect(() => {
    const site = bootstrap.value?.site
    const siteTitle = site ? [site.siteName, site.siteNameEn].filter(Boolean).join(' · ') : ''
    const { title, description } = get()

    document.title = title ? [title, site?.siteName].filter(Boolean).join(' · ') : siteTitle
    const desc = description || site?.description
    if (desc) setMeta('description', desc)
  })
}
