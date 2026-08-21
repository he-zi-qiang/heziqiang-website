import { z } from 'zod'
import { ENTRY_KIND_LIST } from '../lib/kinds.js'

const kindEnum = z.enum(ENTRY_KIND_LIST as [string, ...string[]])

export const entryCreateSchema = z.object({
  kind: kindEnum,
  slug: z.string().trim().max(120).optional(),
  title: z.string().trim().min(1, '标题不能为空').max(200),
  tag: z.string().trim().max(40).nullish(),
  dateLabel: z.string().trim().max(40).default(''),
  dateFull: z.string().trim().max(60).nullish(),
  groupLabel: z.string().trim().max(40).nullish(),
  summary: z.string().trim().max(600).default(''),
  bodyMd: z.string().default(''),
  status: z.enum(['draft', 'published']).default('draft'),
  sortIndex: z.coerce.number().int().default(0),
})

export const entryUpdateSchema = entryCreateSchema.partial()

export const photoCreateSchema = z.object({
  /** 允许为空：先占一格、之后再上传图片，是照片页的正常用法 */
  url: z.string().trim().default(''),
  caption: z.string().trim().max(300).default(''),
  whenLabel: z.string().trim().max(40).default(''),
  alt: z.string().trim().max(200).default(''),
  sortIndex: z.coerce.number().int().default(0),
})

export const photoUpdateSchema = photoCreateSchema.partial()

export const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, '新密码至少 8 位'),
})

export type EntryCreateInput = z.infer<typeof entryCreateSchema>
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>
