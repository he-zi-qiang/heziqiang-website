import { z } from 'zod'

/**
 * 单页内容（SiteDoc）的形状定义。
 * 每个 key 一套 schema + 一份缺省值：数据库里没有记录时前端也能拿到完整结构。
 */

export const siteDocSchema = z.object({
  siteName: z.string(),
  siteNameEn: z.string(),
  description: z.string(),
  footerLeft: z.string(),
  footerRight: z.string(),
  avatar: z.string(),
})

export const homeDocSchema = z.object({
  pro: z.object({
    lede: z.string(),
    nowLabel: z.string(),
    now: z.string(),
  }),
  personal: z.object({
    lede: z.string(),
    nowLabel: z.string(),
    now: z.string(),
  }),
})

const contactRowSchema = z.object({
  k: z.string(),
  /** 支持行内 Markdown（邮箱、链接） */
  v: z.string(),
})

export const aboutDocSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  /** Markdown 正文 */
  body: z.string(),
  nowLabel: z.string(),
  now: z.string(),
  contactLabel: z.string(),
  contacts: z.array(contactRowSchema),
})

const cvRowSchema = z.object({
  k: z.string(),
  /** 支持行内 Markdown */
  v: z.string(),
})

export const cvDocSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  sections: z.array(
    z.object({
      label: z.string(),
      rows: z.array(cvRowSchema),
    }),
  ),
})

const sectionMetaSchema = z.object({
  /** 栏目页顶部的大标题 */
  title: z.string(),
  subtitle: z.string(),
  /** 短名称，用在面包屑与内页 meta。留空则回退到 title */
  label: z.string().default(''),
  /** 英文短名，面包屑右半边那个词 */
  en: z.string().default(''),
})

/** 各列表栏目页顶部的标题与副标题 */
export const sectionsDocSchema = z.object({
  writing: sectionMetaSchema,
  project: sectionMetaSchema,
  essay: sectionMetaSchema,
  reading: sectionMetaSchema,
  learning: sectionMetaSchema,
  photos: sectionMetaSchema,
})

const navRowSchema = z.object({
  zh: z.string(),
  en: z.string(),
  /** 站内路径，如 /writing、/about#contact */
  to: z.string(),
})

/** 首页两侧的索引导航 */
export const navDocSchema = z.object({
  pro: z.array(navRowSchema),
  personal: z.array(navRowSchema),
})

/**
 * 界面上那些不属于任何一篇内容的固定文字。
 * 从页眉的 Professional/Personal，到「打印 / 存为 PDF」、加载提示、404 页——
 * 凡是访客能看见的写死文案，都收在这里，后台可改。
 */
export const uiDocSchema = z.object({
  header: z.object({
    proLabel: z.string(),
    personalLabel: z.string(),
    switchAria: z.string(),
    themeAria: z.string(),
    toLight: z.string(),
    toDark: z.string(),
  }),
  crumb: z.object({
    /** 列表页顶部那条回首页的面包屑，整串可改 */
    index: z.string(),
    /** 内页面包屑的前缀箭头 */
    backPrefix: z.string(),
  }),
  article: z.object({
    endMark: z.string(),
    backLabel: z.string(),
    nextPrefix: z.string(),
    prevPrefix: z.string(),
    linkSuffix: z.string(),
  }),
  cv: z.object({ printLabel: z.string() }),
  photos: z.object({ emptySlot: z.string() }),
  states: z.object({
    loading: z.string(),
    loadFailed: z.string(),
    offline: z.string(),
    emptyList: z.string(),
    emptyPhotos: z.string(),
    /** 访问一个不存在的内容时显示的话 */
    notFoundContent: z.string(),
  }),
  notFound: z.object({
    title: z.string(),
    subtitle: z.string(),
    links: z.array(navRowSchema),
  }),
})

export const DOC_SCHEMAS = {
  site: siteDocSchema,
  home: homeDocSchema,
  about: aboutDocSchema,
  cv: cvDocSchema,
  sections: sectionsDocSchema,
  nav: navDocSchema,
  ui: uiDocSchema,
} as const

export type DocKey = keyof typeof DOC_SCHEMAS
export const DOC_KEYS = Object.keys(DOC_SCHEMAS) as DocKey[]

export function isDocKey(v: unknown): v is DocKey {
  return typeof v === 'string' && v in DOC_SCHEMAS
}

export type SiteDocData = z.infer<typeof siteDocSchema>
export type HomeDocData = z.infer<typeof homeDocSchema>
export type AboutDocData = z.infer<typeof aboutDocSchema>
export type CvDocData = z.infer<typeof cvDocSchema>
export type SectionsDocData = z.infer<typeof sectionsDocSchema>
export type NavDocData = z.infer<typeof navDocSchema>
export type UiDocData = z.infer<typeof uiDocSchema>
