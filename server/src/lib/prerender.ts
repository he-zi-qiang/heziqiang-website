import { ENTRY_KINDS, ENTRY_KIND_LIST, isEntryKind } from './kinds.js'
import { escapeHtml, type Page } from './page.js'

/**
 * 给不执行 JS 的访问者（百度这类爬虫、关掉脚本的浏览器）准备的一份静态正文，写进 <div id="app"> 里。
 *
 * 正常浏览器里 index.html 头部的小脚本会先给 <html> 打上 .js，这份内容随即被 CSS 藏起来，
 * Vue 挂载时再整个替换掉——访客看到的和以前完全一样。内容与前端渲染的是同一份数据，不是另写一套给爬虫看的。
 * 结构只求语义清楚：标题、正文、链接都在，样式沿用站点的类名，没 JS 时也大体能看。
 */

interface Loose {
  [key: string]: unknown
}
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const arr = (v: unknown) => (Array.isArray(v) ? (v as Loose[]) : [])
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Loose) : {})
const esc = (v: unknown) => escapeHtml(str(v))

function entryList(items: Loose[]): string {
  if (!items.length) return ''
  const rows = items.map((e) => {
    const title = esc(e.title) || esc(e.dateLabel)
    const head = e.href ? `<a href="${esc(e.href)}">${title}</a>` : title
    const note = e.summary ? `<p class="e-note">${esc(e.summary)}</p>` : ''
    return `<li><span class="date">${esc(e.dateLabel)}</span> ${head}${note}</li>`
  })
  return `<ul>${rows.join('')}</ul>`
}

function defList(rows: Loose[]): string {
  if (!rows.length) return ''
  return `<dl>${rows.map((r) => `<dt>${esc(r.k)}</dt><dd>${str(r.vHtml)}</dd>`).join('')}</dl>`
}

function navLinks(rows: Loose[]): string {
  return rows.map((r) => `<a href="${esc(r.to)}">${esc(r.zh)}</a>`).join(' · ')
}

function mainOf(page: Page, boot: Loose, data: Loose | undefined): string {
  const sections = obj(boot.sections)
  const notFound = obj(obj(boot.ui).notFound)
  const missing = `<h1 class="page-title">${esc(notFound.title) || '404'}</h1><p class="page-sub">${esc(notFound.subtitle)}</p>`

  switch (page.name) {
    case 'home': {
      const home = obj(boot.home)
      const recent = obj(boot.recent)
      return (['pro', 'personal'] as const)
        .map((side) => {
          const h = obj(home[side])
          return `<section><p class="lede">${str(h.ledeHtml)}</p><p class="now">${str(h.nowHtml)}</p>${entryList(arr(recent[side]))}</section>`
        })
        .join('')
    }
    case 'about':
      if (!data) return missing
      return [
        `<h1 class="page-title">${esc(data.title)}</h1>`,
        `<p class="page-sub">${esc(data.subtitle)}</p>`,
        `<div class="article-body">${str(data.bodyHtml)}</div>`,
        `<div class="article-body">${str(data.nowHtml)}</div>`,
        `<h2>${esc(data.contactLabel)}</h2>${defList(arr(data.contacts))}`,
      ].join('')
    case 'cv':
      if (!data) return missing
      return [
        `<h1 class="page-title">${esc(data.title)}</h1>`,
        `<p class="cv-intro">${str(data.introHtml)}</p>`,
        ...arr(data.sections).map((s) => `<h2>${esc(s.label)}</h2>${defList(arr(s.rows))}`),
      ].join('')
    case 'list': {
      const meta = obj(sections[page.kind])
      const items = data ? arr(data.items) : []
      return `<h1 class="page-title">${esc(meta.title)}</h1><p class="page-sub">${esc(meta.subtitle)}</p>${entryList(items)}`
    }
    case 'detail': {
      if (!data) return missing
      const kind = str(data.kind)
      const listPath = isEntryKind(kind) ? `/${ENTRY_KINDS[kind].path}` : '/'
      const listLabel = esc(obj(sections[kind]).title) || listPath
      return [
        `<article>`,
        `<h1 class="page-title">${esc(data.title)}</h1>`,
        `<p class="article-meta">${esc(data.dateFull) || esc(data.dateLabel)}</p>`,
        `<div class="article-body">${str(data.bodyHtml)}</div>`,
        `</article>`,
        `<p><a href="${listPath}">← ${listLabel}</a></p>`,
      ].join('')
    }
    case 'photos': {
      const meta = obj(sections.photos)
      const figures = (data ? arr(data.items) : [])
        .filter((p) => p.url)
        .map(
          (p) =>
            `<figure><img src="${esc(p.url)}" alt="${esc(p.alt)}" loading="lazy" /><figcaption>${esc(p.whenLabel)} ${esc(p.caption)}</figcaption></figure>`,
        )
      return `<h1 class="page-title">${esc(meta.title)}</h1><p class="page-sub">${esc(meta.subtitle)}</p>${figures.join('')}`
    }
    default:
      return `${missing}<p>${navLinks(arr(notFound.links))}</p>`
  }
}

/** 和前台首页一样：还没有内容的栏目不放进导航 */
function hasContent(row: Loose, counts: Loose): boolean {
  const path = str(row.to).split(/[?#]/)[0]
  const kind = ENTRY_KIND_LIST.find((k) => `/${ENTRY_KINDS[k].path}` === path)
  const key = kind ?? (path === '/photos' ? 'photos' : null)
  return key === null || typeof counts[key] !== 'number' || (counts[key] as number) > 0
}

/** 整页的静态版本；后台页面和取不到站点信息时返回空串，交给前端 */
export function renderSnapshot(page: Page, preload: Record<string, unknown>, dataPath: string | null): string {
  if (page.name === 'admin') return ''
  const boot = preload['/bootstrap'] as Loose | undefined
  if (!boot) return ''
  const site = obj(boot.site)
  const nav = obj(boot.nav)
  const data = dataPath ? (preload[dataPath] as Loose | undefined) : undefined
  const siteTitle = [esc(site.siteName), esc(site.siteNameEn)].filter(Boolean).join(' · ')

  return [
    `<div class="page prerender">`,
    `<header class="site-head"><a class="name" href="/">${siteTitle}</a></header>`,
    `<nav class="prerender-nav">${navLinks([...arr(nav.pro), ...arr(nav.personal)].filter((r) => hasContent(r, obj(boot.counts))))}</nav>`,
    `<main>${mainOf(page, boot, data)}</main>`,
    `<footer class="site-foot"><span>${esc(site.footerLeft)}</span> <span>${esc(site.footerRight)}</span></footer>`,
    `</div>`,
  ].join('\n')
}
