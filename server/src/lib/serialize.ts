import type { Entry, Photo, Prisma } from '@prisma/client'
import { ENTRY_KINDS, type EntryKind } from './kinds.js'

/**
 * 同一栏目内条目的顺序，前台列表、文末上下篇、后台列表共用。
 * sortIndex 越小越靠前；同号时后建的在前——后台新写一篇（sortIndex 默认 0）就直接排在最上面。
 */
export const ENTRY_ORDER: Prisma.EntryOrderByWithRelationInput[] = [{ sortIndex: 'asc' }, { id: 'desc' }]

/** 列表里的条目：不带正文，省流量 */
export function toEntrySummary(e: Entry) {
  return {
    slug: e.slug,
    kind: e.kind,
    title: e.title,
    tag: e.tag,
    dateLabel: e.dateLabel,
    groupLabel: e.groupLabel,
    summary: e.summary,
    /** 有正文才有内页可点 */
    hasBody: e.bodyHtml.length > 0,
    href: e.bodyHtml.length > 0 ? entryHref(e.kind, e.slug) : null,
  }
}

/** 内页：带渲染好的正文 */
export function toEntryDetail(e: Entry) {
  return {
    ...toEntrySummary(e),
    dateFull: e.dateFull,
    bodyHtml: e.bodyHtml,
    publishedAt: e.publishedAt,
    updatedAt: e.updatedAt,
  }
}

/** 后台用：连 Markdown 源码和草稿状态一起给 */
export function toEntryAdmin(e: Entry) {
  return {
    id: e.id,
    kind: e.kind,
    slug: e.slug,
    title: e.title,
    tag: e.tag,
    dateLabel: e.dateLabel,
    dateFull: e.dateFull,
    groupLabel: e.groupLabel,
    summary: e.summary,
    bodyMd: e.bodyMd,
    status: e.status,
    sortIndex: e.sortIndex,
    publishedAt: e.publishedAt,
    updatedAt: e.updatedAt,
    href: e.bodyMd ? entryHref(e.kind, e.slug) : null,
  }
}

export function entryHref(kind: string, slug: string): string {
  const conf = ENTRY_KINDS[kind as EntryKind]
  return conf ? `/${conf.path}/${slug}` : `/${slug}`
}

export function toPhoto(p: Photo) {
  return {
    id: p.id,
    url: p.url,
    caption: p.caption,
    whenLabel: p.whenLabel,
    alt: p.alt || p.caption,
    sortIndex: p.sortIndex,
  }
}

/**
 * 列表的年份小标题（year-mark）：取「列表日期」开头的四位年份，
 * 「6 月」「重读」这类不带年份的，退回到发布时间的年份；都没有就不分组。
 */
export function entryYear(e: Pick<Entry, 'dateLabel' | 'publishedAt'>): string | null {
  const m = /^\s*(\d{4})/.exec(e.dateLabel)
  if (m) return m[1]!
  return e.publishedAt ? String(e.publishedAt.getFullYear()) : null
}

/** 把一串条目按小标题分组，保持传入的顺序；相邻且小标题相同的归为一组 */
export function groupEntries<T>(items: T[], labelOf: (item: T) => string | null) {
  const groups: { label: string | null; items: T[] }[] = []
  for (const item of items) {
    const label = labelOf(item)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}
