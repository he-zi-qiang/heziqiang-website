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
  title: z.string(),
  subtitle: z.string(),
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

export const DOC_SCHEMAS = {
  site: siteDocSchema,
  home: homeDocSchema,
  about: aboutDocSchema,
  cv: cvDocSchema,
  sections: sectionsDocSchema,
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
