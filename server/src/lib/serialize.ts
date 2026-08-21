import type { Entry, Photo } from '@prisma/client'
import { ENTRY_KINDS, type EntryKind } from './kinds.js'

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
 * 把一串条目按 groupLabel 分组，保持数据库给出的顺序。
 * 旧站里的「2026 / 2025」「在读」小标题就是靠这个还原的。
 */
export function groupEntries<T extends { groupLabel: string | null }>(items: T[]) {
  const groups: { label: string | null; items: T[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.label === item.groupLabel) last.items.push(item)
    else groups.push({ label: item.groupLabel, items: [item] })
  }
  return groups
}
