import type { FastifyInstance } from 'fastify'
import { env } from '../env.js'
import { ENTRY_KINDS, ENTRY_KIND_LIST, type EntryKind } from './kinds.js'

/**
 * 服务端认得的前台页面。和 web/src/router 的公开路由一一对应：
 * 访客直接打开一个地址时，靠它决定预载哪份数据、HTML 里写什么标题、返回什么状态码。
 */
export type Page =
  | { name: 'home' | 'about' | 'cv' | 'photos' | 'admin' | 'unknown' }
  | { name: 'list'; kind: EntryKind }
  | { name: 'detail'; kind: EntryKind; slug: string }

export function resolvePage(rawUrl: string): { page: Page; pathname: string } {
  let pathname: string
  let decoded: string
  try {
    pathname = new URL(rawUrl, 'http://site.local').pathname.replace(/\/+$/, '') || '/'
    decoded = decodeURIComponent(pathname)
  } catch {
    return { page: { name: 'unknown' }, pathname: '/' }
  }

  if (decoded === '/') return { page: { name: 'home' }, pathname }
  if (decoded === '/about') return { page: { name: 'about' }, pathname }
  if (decoded === '/cv') return { page: { name: 'cv' }, pathname }
  if (decoded === '/photos') return { page: { name: 'photos' }, pathname }
  if (decoded === '/admin' || decoded.startsWith('/admin/')) return { page: { name: 'admin' }, pathname }

  const [, section, slug, extra] = decoded.split('/')
  const kind = ENTRY_KIND_LIST.find((k) => ENTRY_KINDS[k].path === section)
  if (kind && extra === undefined) {
    return { page: slug ? { name: 'detail', kind, slug } : { name: 'list', kind }, pathname }
  }
  return { page: { name: 'unknown' }, pathname }
}

/**
 * 这一页要用的公开接口。
 * 路径字符串必须和前端 web/src/api/client.ts 里的 publicPath 逐字一致——前端按它查缓存。
 */
export function dataPathOf(page: Page): string | null {
  switch (page.name) {
    case 'about':
      return '/docs/about'
    case 'cv':
      return '/docs/cv'
    case 'photos':
      return '/photos'
    case 'list':
      return `/entries?kind=${page.kind}`
    case 'detail':
      return `/entries/${encodeURIComponent(page.slug)}`
    default:
      return null
  }
}

/** 首屏预载：走一遍应用自己的公开接口（app.inject，不出进程），只收 200 的结果。后台页不预载 */
export async function collectPreload(app: FastifyInstance, page: Page) {
  const preload: Record<string, unknown> = {}
  if (page.name === 'admin') return preload
  const paths = ['/bootstrap', dataPathOf(page)].filter((p): p is string => p !== null)
  await Promise.all(
    paths.map(async (path) => {
      const res = await app.inject({ method: 'GET', url: `/api${path}` })
      if (res.statusCode === 200) preload[path] = res.json()
    }),
  )
  return preload
}

/* ---------------- 每一页的标题、描述与分享卡片 ---------------- */

export interface PageMeta {
  title: string
  description: string
  /** 规范地址（绝对 URL） */
  url: string
  type: 'website' | 'article'
  /** 不存在的页面要回 404，并且不让搜索引擎收录 */
  found: boolean
  noindex: boolean
  /** 分享卡片上的站名 */
  siteName: string
}

interface Loose {
  [key: string]: unknown
}

const DESCRIPTION_MAX = 120

/** 渲染好的 HTML → 一段纯文本，用作描述 */
export function htmlToText(html: string, max = DESCRIPTION_MAX): string {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/**
 * 和前端各页面的 useHead 用同一套规则：「页面标题 · 站名」，首页只用站名。
 * 数据全部来自刚预载的那几份，不再单独查库。
 */
export function pageMeta(page: Page, pathname: string, preload: Record<string, unknown>): PageMeta {
  const boot = (preload['/bootstrap'] ?? {}) as Loose
  const site = (boot.site ?? {}) as Loose
  const sections = (boot.sections ?? {}) as Record<string, Loose>
  const notFound = ((boot.ui as Loose | undefined)?.notFound ?? {}) as Loose
  const siteName = str(site.siteName)
  const siteTitle = [siteName, str(site.siteNameEn)].filter(Boolean).join(' · ')
  const siteDescription = str(site.description)

  const data = (() => {
    const path = dataPathOf(page)
    return path ? (preload[path] as Loose | undefined) : undefined
  })()

  const titled = (title: string) => (title ? [title, siteName].filter(Boolean).join(' · ') : siteTitle)
  const base = {
    url: env.siteUrl + (pathname === '/' ? '/' : pathname),
    type: 'website' as const,
    found: true,
    noindex: false,
    siteName: siteTitle,
  }
  const missing: PageMeta = {
    ...base,
    title: titled(str(notFound.title) || '404'),
    description: str(notFound.subtitle) || siteDescription,
    found: false,
    noindex: true,
  }

  switch (page.name) {
    case 'home':
      return { ...base, title: siteTitle, description: siteDescription }
    case 'about':
      if (!data) return missing
      return {
        ...base,
        title: titled(str(data.title)),
        description: htmlToText(str(data.bodyHtml)) || siteDescription,
      }
    case 'cv':
      if (!data) return missing
      return {
        ...base,
        title: titled(str(data.title)),
        description: htmlToText(str(data.introHtml)) || siteDescription,
      }
    case 'photos':
    case 'list': {
      const meta = sections[page.name === 'list' ? page.kind : 'photos'] ?? {}
      return { ...base, title: titled(str(meta.title)), description: str(meta.subtitle) || siteDescription }
    }
    case 'detail':
      if (!data) return missing
      return {
        ...base,
        type: 'article',
        title: titled(str(data.title)),
        description: str(data.summary) || htmlToText(str(data.bodyHtml)) || siteDescription,
      }
    case 'admin':
      return { ...base, title: titled('后台'), description: siteDescription, noindex: true }
    default:
      return missing
  }
}

/* ---------------- 写进 <head> ---------------- */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 能安全放进 <script> 的 JSON：转义 < > & 和两个 JS 里算换行的 Unicode 字符 */
export function scriptSafeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * 把这一页的标题、描述、规范地址、分享卡片、预载数据和静态正文（见 prerender.ts）写进 index.html。
 * 分享卡片（微信、QQ、Slack 这类）和不执行 JS 的爬虫只看得到这里写的东西。
 */
export function renderIndexHtml(
  template: string,
  meta: PageMeta,
  preload: Record<string, unknown>,
  snapshot: string,
) {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const url = escapeHtml(meta.url)
  const image = `${env.siteUrl}/og.png`
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="zh_CN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    meta.noindex ? `<meta name="robots" content="noindex" />` : '',
    `<script>window.__PRELOAD__=${scriptSafeJson(preload)}</script>`,
  ]
    .filter(Boolean)
    .join('\n')

  // 一律用函数做替换：内容里要是出现 $& 这类字符，字符串替换会把它当成特殊模式
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${title}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => `<meta name="description" content="${description}" />`)
    .replace('</head>', () => `${head}\n</head>`)
    .replace('<div id="app"></div>', () => `<div id="app">${snapshot}</div>`)
}
