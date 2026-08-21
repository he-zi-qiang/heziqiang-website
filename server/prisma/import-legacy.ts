/**
 * ============================================================
 *  一次性内容迁移：把旧的手写静态站（legacy/*.html）解析成结构化数据
 *  产物：prisma/seed-data.json —— 之后由 seed.ts 写库。
 *
 *  跑法：npm run db:import -w server
 *  跑过一次并确认无误后，legacy/ 目录就可以删掉了。
 * ============================================================
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, type HTMLElement } from 'node-html-parser'

const here = path.dirname(fileURLToPath(import.meta.url))
const LEGACY = path.resolve(here, '../../legacy')
const OUT = path.join(here, 'seed-data.json')

/* ---------- 工具 ---------- */

function read(file: string): HTMLElement {
  return parse(fs.readFileSync(path.join(LEGACY, file), 'utf8'))
}

function text(el: HTMLElement | null | undefined): string {
  if (!el) return ''
  return decode(el.structuredText ?? el.text).replace(/\s+/g, ' ').trim()
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** 内联 HTML 原样保留（design 里的 <span class="light">、<br> 都要留住） */
function inlineHtml(el: HTMLElement | null | undefined): string {
  if (!el) return ''
  return el.innerHTML
    .replace(/\s*\n\s*/g, '')
    .replace(/href="([a-z0-9-]+)\.html([^"]*)"/gi, (_m, slug, rest) => `href="${legacyHref(slug)}${rest}"`)
    .trim()
}

/** 旧站的 xxx.html 链接改写成新前端的路由 */
function legacyHref(slug: string): string {
  const map: Record<string, string> = {
    index: '/',
    about: '/about',
    cv: '/cv',
    writing: '/writing',
    projects: '/projects',
    essays: '/essays',
    reading: '/reading',
    learning: '/learning',
    photos: '/photos',
  }
  if (map[slug]) return map[slug]!
  const kind = detailKind(slug)
  return kind ? `/${kindPath(kind)}/${slug}` : `/${slug}`
}

const DETAIL_PAGES: Record<string, string> = {
  'instruction-drift': 'writing',
  'claude-code-remote-ssh-debug': 'writing',
  'chaoxing-restricted-pdf-download': 'writing',
  'writing-agent-memory': 'writing',
  'essay-slow-notes': 'essay',
  'project-task-planner': 'project',
}
function detailKind(slug: string): string | undefined {
  return DETAIL_PAGES[slug]
}
function kindPath(kind: string): string {
  return { writing: 'writing', project: 'projects', essay: 'essays' }[kind] ?? kind
}

/* ---------- HTML → Markdown ---------- */

function toMarkdown(container: HTMLElement | null): string {
  if (!container) return ''
  const blocks: string[] = []

  for (const node of container.childNodes) {
    const el = node as HTMLElement
    if (!el.tagName) {
      const stray = decode(el.text ?? '').trim()
      if (stray) blocks.push(stray)
      continue
    }
    const tag = el.tagName.toLowerCase()
    switch (tag) {
      case 'h2':
        blocks.push(`## ${inline(el)}`)
        break
      case 'h3':
        blocks.push(`### ${inline(el)}`)
        break
      case 'p':
        blocks.push(inline(el))
        break
      case 'blockquote':
        blocks.push(`> ${inline(el)}`)
        break
      case 'ul':
        blocks.push(el.querySelectorAll('li').map((li) => `- ${inline(li)}`).join('\n'))
        break
      case 'ol':
        blocks.push(el.querySelectorAll('li').map((li, i) => `${i + 1}. ${inline(li)}`).join('\n'))
        break
      case 'pre':
        blocks.push('```\n' + decode(el.text).trim() + '\n```')
        break
      case 'hr':
        blocks.push('---')
        break
      default:
        // .aside-note 这类带样式的块原样保留成 HTML —— markdown-it 开了 html:true
        blocks.push(el.outerHTML.replace(/\s*\n\s*/g, ' ').trim())
    }
  }
  return blocks.filter(Boolean).join('\n\n')
}

/** 行内元素转 Markdown：strong / em / code / a 转语法，其余保留原样 */
function inline(el: HTMLElement): string {
  let out = ''
  for (const node of el.childNodes) {
    const child = node as HTMLElement
    if (!child.tagName) {
      out += decode(child.text ?? '')
      continue
    }
    const tag = child.tagName.toLowerCase()
    if (tag === 'strong' || tag === 'b') out += `**${inline(child)}**`
    else if (tag === 'em' || tag === 'i') out += `*${inline(child)}*`
    else if (tag === 'code') out += `\`${decode(child.text)}\``
    else if (tag === 'br') out += '  \n'
    else if (tag === 'a') {
      const href = child.getAttribute('href') ?? ''
      const fixed = /^https?:|^mailto:|^#|^\//.test(href)
        ? href
        : legacyHref(href.replace(/\.html.*$/, ''))
      out += `[${inline(child)}](${fixed})`
    } else out += child.outerHTML
  }
  return out.replace(/[ \t]+/g, ' ').trim()
}

/* ---------- 列表页解析 ---------- */

type SeedEntry = {
  kind: string
  slug: string
  title: string
  tag: string | null
  dateLabel: string
  dateFull: string | null
  groupLabel: string | null
  summary: string
  bodyMd: string
  status: 'published'
  sortIndex: number
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function parseListPage(file: string, kind: string): SeedEntry[] {
  const doc = read(file)
  const main = doc.querySelector('main')
  if (!main) return []

  const entries: SeedEntry[] = []
  let group: string | null = null
  let order = 0

  for (const node of main.childNodes) {
    const el = node as HTMLElement
    if (!el.tagName) continue
    const cls = el.getAttribute('class') ?? ''

    if (cls.includes('year-mark')) {
      group = text(el) || null
      continue
    }
    if (!cls.includes('entry-list')) continue

    for (const item of el.querySelectorAll('.entry')) {
      const href = item.getAttribute('href') ?? ''
      const slugFromHref = href.replace(/\.html.*$/, '')
      const titleEl = item.querySelector('.e-title')
      const tagEl = titleEl?.querySelector('.tag')
      const tag = tagEl ? text(tagEl) : null
      if (tagEl) tagEl.remove()

      const dateLabel = text(item.querySelector('.date'))
      const title = titleEl ? text(titleEl) : dateLabel
      const summary = text(item.querySelector('.e-note'))
      const slug = slugFromHref || `${kind}-${slugify(title)}`

      entries.push({
        kind,
        slug,
        title,
        tag,
        dateLabel,
        dateFull: null,
        groupLabel: group,
        summary,
        bodyMd: '',
        status: 'published',
        sortIndex: order++,
      })
    }
  }
  return entries
}

/* ---------- 内页解析：把正文填回对应 entry ---------- */

function fillBody(entry: SeedEntry) {
  const file = `${entry.slug}.html`
  if (!fs.existsSync(path.join(LEGACY, file))) return
  const doc = read(file)
  entry.bodyMd = toMarkdown(doc.querySelector('.article-body'))
  const meta = doc.querySelector('.article-meta')
  if (meta) {
    entry.dateFull = text(meta).replace(/\s*·\s*/g, ' · ')
  }
}

/* ---------- 单页 ---------- */

function parseHome() {
  const doc = read('index.html')
  const pick = (sel: string) => {
    const sec = doc.querySelector(sel)
    return {
      lede: sec ? inline(sec.querySelector('.lede')!) : '',
      nowLabel: text(sec?.querySelector('.section-label')),
      now: sec ? inline(sec.querySelector('.now')!) : '',
    }
  }
  return { pro: pick('.only-pro'), personal: pick('.only-personal') }
}

function parseAbout() {
  const doc = read('about.html')
  const main = doc.querySelector('main')!
  const bodies = main.querySelectorAll('.article-body')
  const labels = main.querySelectorAll('.section-label')
  return {
    title: text(main.querySelector('.page-title')),
    subtitle: text(main.querySelector('.page-sub')),
    body: toMarkdown(bodies[0] ?? null),
    nowLabel: text(labels[0]),
    now: toMarkdown(bodies[1] ?? null),
    contactLabel: text(labels[1]),
    contacts: main.querySelectorAll('.def-row').map((row) => ({
      k: text(row.querySelector('.k')),
      v: inlineHtml(row.querySelector('.v')),
    })),
  }
}

function parseCv() {
  const doc = read('cv.html')
  const main = doc.querySelector('main')!
  const sections: { label: string; rows: { k: string; v: string }[] }[] = []
  let current: { label: string; rows: { k: string; v: string }[] } | null = null

  for (const node of main.childNodes) {
    const el = node as HTMLElement
    if (!el.tagName) continue
    const cls = el.getAttribute('class') ?? ''
    if (cls.includes('section-label')) {
      current = { label: text(el), rows: [] }
      sections.push(current)
    } else if (cls.includes('def-list') && current) {
      for (const row of el.querySelectorAll('.def-row')) {
        current.rows.push({ k: text(row.querySelector('.k')), v: inlineHtml(row.querySelector('.v')) })
      }
    }
  }
  const sub = main.querySelector('.page-sub')
  sub?.querySelector('.no-print')?.remove()
  sub?.querySelector('.sep')?.remove()
  return {
    title: text(main.querySelector('.page-title')),
    subtitle: text(sub).replace(/\s*·\s*$/, '').trim(),
    sections,
  }
}

function parsePhotos() {
  const doc = read('photos.html')
  return doc.querySelectorAll('.photo-item').map((item, i) => {
    const cap = item.querySelector('.photo-cap')
    const when = cap?.querySelector('.when')
    const whenLabel = text(when)
    when?.remove()
    return { url: '', caption: text(cap), whenLabel, alt: '', sortIndex: i }
  })
}

function parseListPageMeta(file: string) {
  const doc = read(file)
  const main = doc.querySelector('main')!
  return {
    title: text(main.querySelector('.page-title')),
    subtitle: text(main.querySelector('.page-sub')),
  }
}

/* ---------- 主流程 ---------- */

const entries: SeedEntry[] = [
  ...parseListPage('writing.html', 'writing'),
  ...parseListPage('projects.html', 'project'),
  ...parseListPage('essays.html', 'essay'),
  ...parseListPage('reading.html', 'reading'),
  ...parseListPage('learning.html', 'learning'),
]
entries.forEach(fillBody)

// slug 去重保险
const seen = new Set<string>()
for (const e of entries) {
  let s = e.slug
  let n = 2
  while (seen.has(s)) s = `${e.slug}-${n++}`
  e.slug = s
  seen.add(s)
}

const data = {
  site: {
    siteName: '何梓强',
    siteNameEn: 'He Ziqiang',
    description: text(read('index.html').querySelector('meta[name="description"]')) ||
      '何梓强（He Ziqiang）的个人网站——软件工程学生，研究 LLM Agent 的记忆、规划与人机协作。',
    footerLeft: '© 2024–2026 何梓强',
    footerRight: '始于 2024 · 长期维护',
    avatar: '/avatar.png',
  },
  home: parseHome(),
  about: parseAbout(),
  cv: parseCv(),
  sections: {
    writing: parseListPageMeta('writing.html'),
    project: parseListPageMeta('projects.html'),
    essay: parseListPageMeta('essays.html'),
    reading: parseListPageMeta('reading.html'),
    learning: parseListPageMeta('learning.html'),
    photos: parseListPageMeta('photos.html'),
  },
  entries,
  photos: parsePhotos(),
}

// index.html 的 meta description 用属性而不是文本
data.site.description =
  read('index.html').querySelector('meta[name="description"]')?.getAttribute('content') ??
  data.site.description

fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`✔ 已解析 ${entries.length} 条内容、${data.photos.length} 张照片 → ${path.relative(process.cwd(), OUT)}`)
for (const e of entries) {
  console.log(`   ${e.kind.padEnd(9)} ${e.bodyMd ? '有正文' : '仅列表'}  ${e.title}`)
}
