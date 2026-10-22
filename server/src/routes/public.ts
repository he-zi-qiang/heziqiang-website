import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db.js'
import { readDoc, type DocData } from '../lib/docs.js'
import { ENTRY_KINDS, ENTRY_KIND_LIST, isEntryKind, type EntryKind } from '../lib/kinds.js'
import {
  ENTRY_ORDER,
  entryYear,
  groupEntries,
  toEntryDetail,
  toEntrySummary,
  toPhoto,
} from '../lib/serialize.js'
import { DOC_KEYS, isDocKey } from '../schemas/docs.js'
import { renderAboutDoc, renderCvDoc, renderHomeDoc } from '../lib/render-docs.js'

/** 首页「最近」每侧列几条 */
const RECENT_LIMIT = 3

/** 首页「最近」取哪些栏目：按所属一侧分，学习记录没有标题，不放进来 */
function recentKinds(section: 'pro' | 'personal'): EntryKind[] {
  return ENTRY_KIND_LIST.filter((k) => ENTRY_KINDS[k].section === section && k !== 'learning')
}

/** 某一侧最近发布、有内页的几篇 */
async function recentEntries(section: 'pro' | 'personal') {
  const rows = await prisma.entry.findMany({
    where: { status: 'published', kind: { in: recentKinds(section) }, NOT: { bodyHtml: '' } },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: RECENT_LIMIT,
  })
  return rows.map(toEntrySummary)
}

/** 各栏目已发布的条数与照片张数，首页据此把空栏目从索引里藏起来 */
async function sectionCounts(): Promise<Record<EntryKind | 'photos', number>> {
  const [byKind, photos] = await Promise.all([
    prisma.entry.groupBy({ by: ['kind'], where: { status: 'published' }, _count: { _all: true } }),
    prisma.photo.count(),
  ])
  const counts = Object.fromEntries(ENTRY_KIND_LIST.map((k) => [k, 0])) as Record<EntryKind, number>
  for (const row of byKind) {
    if (isEntryKind(row.kind)) counts[row.kind] = row._count._all
  }
  return { ...counts, photos }
}

/** 站点的公开只读接口——前端渲染需要的一切都从这里来 */
const publicRoutes: FastifyPluginAsync = async (app) => {
  /** 一次性拿到页眉页脚 + 首页需要的全部文案，前端启动时只请求一次 */
  app.get('/bootstrap', async () => {
    const [site, home, sections, nav, ui, recentPro, recentPersonal, counts] = await Promise.all([
      readDoc('site'),
      readDoc('home'),
      readDoc('sections'),
      readDoc('nav'),
      readDoc('ui'),
      recentEntries('pro'),
      recentEntries('personal'),
      sectionCounts(),
    ])
    return {
      site,
      home: home ? renderHomeDoc(home) : null,
      sections,
      nav,
      ui,
      kinds: ENTRY_KINDS,
      recent: { pro: recentPro, personal: recentPersonal },
      counts,
    }
  })

  app.get('/docs/:key', async (req, reply) => {
    const { key } = req.params as { key: string }
    if (!isDocKey(key)) {
      return reply.code(404).send({ error: `未知文档：${key}`, known: DOC_KEYS })
    }
    const doc = await readDoc(key)
    if (!doc) return reply.code(404).send({ error: '该文档还没有内容' })
    if (key === 'home') return renderHomeDoc(doc as DocData<'home'>)
    if (key === 'about') return renderAboutDoc(doc as DocData<'about'>)
    if (key === 'cv') return renderCvDoc(doc as DocData<'cv'>)
    return doc
  })

  /** 栏目列表，已按年份分好组 */
  app.get('/entries', async (req, reply) => {
    const { kind } = req.query as { kind?: string }
    if (kind && !isEntryKind(kind)) {
      return reply.code(400).send({ error: `未知栏目：${kind}` })
    }
    const rows = await prisma.entry.findMany({
      where: { status: 'published', ...(kind ? { kind } : {}) },
      orderBy: [{ kind: 'asc' }, ...ENTRY_ORDER],
    })
    const groups = groupEntries(rows, entryYear).map((g) => ({
      label: g.label,
      items: g.items.map(toEntrySummary),
    }))
    return { total: rows.length, groups, items: rows.map(toEntrySummary) }
  })

  app.get('/entries/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const entry = await prisma.entry.findFirst({ where: { slug, status: 'published' } })
    if (!entry) return reply.code(404).send({ error: '找不到这篇内容' })

    // 同栏目里的上一篇 / 下一篇，用来渲染文末导航
    const siblings = await prisma.entry.findMany({
      where: { kind: entry.kind, status: 'published', NOT: { bodyHtml: '' } },
      orderBy: ENTRY_ORDER,
      select: { slug: true, title: true, kind: true, bodyHtml: false },
    })
    const idx = siblings.findIndex((s) => s.slug === entry.slug)
    return {
      ...toEntryDetail(entry),
      prev: idx > 0 ? siblings[idx - 1] : null,
      next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
    }
  })

  app.get('/photos', async () => {
    const rows = await prisma.photo.findMany({ orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] })
    return { items: rows.map(toPhoto) }
  })

  app.get('/health', async () => ({ ok: true, time: new Date().toISOString() }))
}

export default publicRoutes
