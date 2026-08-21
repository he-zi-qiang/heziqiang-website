import type { z } from 'zod'
import { prisma } from '../db.js'
import { DOC_SCHEMAS, type DocKey } from '../schemas/docs.js'

/** 某个 key 对应的文档数据类型，例如 DocData<'cv'> = CvDocData */
export type DocData<K extends DocKey> = z.infer<(typeof DOC_SCHEMAS)[K]>

/** 读一个单页文档；数据库里没有或坏掉时返回 null，由调用方决定怎么兜底 */
export async function readDoc<K extends DocKey>(key: K): Promise<DocData<K> | null> {
  const row = await prisma.siteDoc.findUnique({ where: { key } })
  if (!row) return null
  try {
    const parsed = DOC_SCHEMAS[key].safeParse(JSON.parse(row.data))
    return parsed.success ? (parsed.data as DocData<K>) : null
  } catch {
    return null
  }
}

export async function writeDoc<K extends DocKey>(key: K, data: unknown): Promise<DocData<K>> {
  const parsed = DOC_SCHEMAS[key].safeParse(data)
  if (!parsed.success) {
    const err = new Error('文档格式不正确') as Error & { issues?: unknown }
    err.issues = parsed.error.issues
    throw err
  }
  const payload = JSON.stringify(parsed.data)
  await prisma.siteDoc.upsert({
    where: { key },
    create: { key, data: payload },
    update: { data: payload },
  })
  return parsed.data as DocData<K>
}
