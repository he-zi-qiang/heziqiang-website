export type EntryKind = 'writing' | 'project' | 'essay' | 'reading' | 'learning'

export interface KindConfig {
  label: string
  en: string
  section: 'pro' | 'personal'
  path: string
}

export interface EntrySummary {
  slug: string
  kind: EntryKind
  title: string
  tag: string | null
  dateLabel: string
  groupLabel: string | null
  summary: string
  hasBody: boolean
  href: string | null
}

export interface EntryDetail extends EntrySummary {
  dateFull: string | null
  bodyHtml: string
  publishedAt: string | null
  updatedAt: string
  prev: { slug: string; title: string; kind: EntryKind } | null
  next: { slug: string; title: string; kind: EntryKind } | null
}

export interface EntryAdmin {
  id: number
  kind: EntryKind
  slug: string
  title: string
  tag: string | null
  dateLabel: string
  dateFull: string | null
  groupLabel: string | null
  summary: string
  bodyMd: string
  status: 'draft' | 'published'
  sortIndex: number
  publishedAt: string | null
  updatedAt: string
  href: string | null
}

export interface EntryGroup {
  label: string | null
  items: EntrySummary[]
}

export interface EntryListResponse {
  total: number
  groups: EntryGroup[]
  items: EntrySummary[]
}

export interface Photo {
  id: number
  url: string
  caption: string
  whenLabel: string
  alt: string
  sortIndex: number
}

export interface SiteDoc {
  siteName: string
  siteNameEn: string
  description: string
  footerLeft: string
  footerRight: string
  avatar: string
}

export interface HomeSide {
  lede: string
  nowLabel: string
  now: string
  /** 后端渲染好的行内 HTML，公开页面直接用，前端不需要 Markdown 解析器 */
  ledeHtml: string
  nowHtml: string
}
export interface HomeDoc {
  pro: HomeSide
  personal: HomeSide
}

export interface AboutDoc {
  title: string
  subtitle: string
  body: string
  nowLabel: string
  now: string
  contactLabel: string
  contacts: { k: string; v: string; vHtml: string }[]
  bodyHtml: string
  nowHtml: string
}

export interface CvDoc {
  title: string
  subtitle: string
  sections: { label: string; rows: { k: string; v: string; vHtml: string }[] }[]
}

/* —— 后台编辑用的原始形状：只有 Markdown 源码，没有渲染结果 —— */

export interface HomeSideSource {
  lede: string
  nowLabel: string
  now: string
}
export interface HomeDocSource {
  pro: HomeSideSource
  personal: HomeSideSource
}
export interface AboutDocSource {
  title: string
  subtitle: string
  body: string
  nowLabel: string
  now: string
  contactLabel: string
  contacts: { k: string; v: string }[]
}
export interface CvDocSource {
  title: string
  subtitle: string
  sections: { label: string; rows: { k: string; v: string }[] }[]
}

export interface SectionMeta {
  title: string
  subtitle: string
}
export type SectionsDoc = Record<EntryKind | 'photos', SectionMeta>

export interface Bootstrap {
  site: SiteDoc | null
  home: HomeDoc | null
  sections: SectionsDoc | null
  kinds: Record<EntryKind, KindConfig>
}

export interface SessionUser {
  id: number
  username: string
  displayName: string
}

export interface UploadResult {
  url: string
  filename: string
  size: number
  mimetype: string
  sha256: string
}

export interface AdminStats {
  byKind: Partial<Record<EntryKind, number>>
  drafts: number
  photos: number
}
