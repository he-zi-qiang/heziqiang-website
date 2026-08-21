/**
 * ============================================================
 *  把数据库里的内容导回 prisma/seed-data.json。
 *  作用是让「站点内容」以可读的文本形式进版本库：
 *    在后台写完 → npm run db:export -w server → git commit
 *  换机器或重装时 npm run db:seed 就能原样恢复。
 *
 *  跑法：npm run db:export -w server
 * ============================================================
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { DOC_KEYS, DOC_SCHEMAS, type DocKey } from '../src/schemas/docs.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, 'seed-data.json')
const prisma = new PrismaClient()

async function main() {
  const docs: Record<string, unknown> = {}
  for (const key of DOC_KEYS as DocKey[]) {
    const row = await prisma.siteDoc.findUnique({ where: { key } })
    if (!row) continue
    const parsed = DOC_SCHEMAS[key].safeParse(JSON.parse(row.data))
    if (parsed.success) docs[key] = parsed.data
    else console.warn(`· 文档 ${key} 与 schema 不符，已跳过`)
  }

  const entries = (
    await prisma.entry.findMany({ orderBy: [{ kind: 'asc' }, { sortIndex: 'asc' }, { id: 'asc' }] })
  ).map((e) => ({
    kind: e.kind,
    slug: e.slug,
    title: e.title,
    tag: e.tag,
    dateLabel: e.dateLabel,
    dateFull: e.dateFull,
    groupLabel: e.groupLabel,
    summary: e.summary,
    // 只导 Markdown 源码；HTML 是派生物，seed 时重新渲染
    bodyMd: e.bodyMd,
    status: e.status,
    sortIndex: e.sortIndex,
  }))

  const photos = (
    await prisma.photo.findMany({ orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] })
  ).map((p) => ({
    url: p.url,
    caption: p.caption,
    whenLabel: p.whenLabel,
    alt: p.alt,
    sortIndex: p.sortIndex,
  }))

  fs.writeFileSync(OUT, JSON.stringify({ ...docs, entries, photos }, null, 2) + '\n', 'utf8')
  console.log(`✔ 已导出 ${entries.length} 条内容、${photos.length} 张照片 → prisma/seed-data.json`)
  console.log('  记得 git add prisma/seed-data.json 一起提交。')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
