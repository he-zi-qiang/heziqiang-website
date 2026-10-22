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
  recentLabel: string
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
  /** 标题下的身份一行（姓名 · 学校 · 专业），行内 Markdown 源码与渲染结果 */
  intro: string
  introHtml: string
  /** 证件照 / 形象照地址，空字符串表示不显示 */
  portrait: string
  sections: { label: string; rows: { k: string; v: string; vHtml: string }[] }[]
}

/* —— 后台编辑用的原始形状：只有 Markdown 源码，没有渲染结果 —— */

export interface HomeSideSource {
  lede: string
  nowLabel: string
  now: string
  recentLabel: string
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
  intro: string
  portrait: string
  sections: { label: string; rows: { k: string; v: string }[] }[]
}

export interface SectionMeta {
  title: string
  subtitle: string
  /** 短名称，用在面包屑与内页 meta；留空则回退到 title */
  label: string
  /** 英文短名 */
  en: string
}
export type SectionsDoc = Record<EntryKind | 'photos', SectionMeta>

export interface NavRow {
  zh: string
  en: string
  to: string
}

export interface NavDoc {
  pro: NavRow[]
  personal: NavRow[]
}

/** 界面上所有写死文案的可编辑版本 */
export interface UiDoc {
  header: {
    proLabel: string
    personalLabel: string
    switchAria: string
    themeAria: string
    toLight: string
    toDark: string
  }
  crumb: { index: string; backPrefix: string }
  article: {
    endMark: string
    backLabel: string
    nextPrefix: string
    prevPrefix: string
    linkSuffix: string
    tocLabel: string
    anchorTitle: string
  }
  cv: { printLabel: string }
  photos: { emptySlot: string }
  list: { yearsLabel: string; countUnit: string }
  states: {
    loading: string
    loadFailed: string
    offline: string
    emptyList: string
    emptyPhotos: string
    notFoundContent: string
  }
  notFound: { title: string; subtitle: string; links: NavRow[] }
}

export interface Bootstrap {
  site: SiteDoc | null
  home: HomeDoc | null
  sections: SectionsDoc | null
  nav: NavDoc | null
  ui: UiDoc | null
  kinds: Record<EntryKind, KindConfig>
  /** 首页「最近」：每侧最近发布、有内页的几篇 */
  recent: { pro: EntrySummary[]; personal: EntrySummary[] }
  /** 各栏目已发布条数与照片张数，首页据此隐藏空栏目 */
  counts: Record<EntryKind | 'photos', number>
}

export interface SessionUser {
  id: number
  username: string
  displayName: string
}

export interface UploadResult {
  url: string
  filename: string
  /** 存下来的大小；图片会被压缩，通常比 originalSize 小得多 */
  size: number
  originalSize: number
  mimetype: string
  sha256: string
}

export interface AdminStats {
  byKind: Partial<Record<EntryKind, number>>
  drafts: number
  photos: number
}
