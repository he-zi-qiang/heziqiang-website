/**
 * ============================================================
 *  初始化数据库：写入管理员账号、单页内容、全部条目与照片。
 *  数据来自 prisma/seed-data.json（由 import-legacy.ts 从旧站解析而来）。
 *  幂等：重复执行只会 upsert，不会产生重复数据。
 * ============================================================
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { env } from '../src/env.js'
import { hashPassword } from '../src/lib/password.js'
import { renderMarkdown } from '../src/lib/markdown.js'
import { DOC_SCHEMAS, type DocKey } from '../src/schemas/docs.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

type SeedFile = {
  site: unknown
  home: unknown
  about: unknown
  cv: unknown
  sections: unknown
  nav: unknown
  ui: unknown
  entries: {
    kind: string
    slug: string
    title: string
    tag: string | null
    dateLabel: string
    dateFull: string | null
    groupLabel: string | null
    summary: string
    bodyMd: string
    status: string
    sortIndex: number
  }[]
  photos: { url: string; caption: string; whenLabel: string; alt: string; sortIndex: number }[]
}

async function main() {
  const file = path.join(here, 'seed-data.json')
  if (!fs.existsSync(file)) {
    throw new Error('缺少 prisma/seed-data.json，请先执行：npm run db:import -w server')
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as SeedFile

  /* —— 1. 管理员 —— */
  const existing = await prisma.user.findUnique({ where: { username: env.ADMIN_USERNAME } })
  if (existing) {
    console.log(`· 管理员 ${env.ADMIN_USERNAME} 已存在，跳过（改密码请到后台）`)
  } else {
    await prisma.user.create({
      data: {
        username: env.ADMIN_USERNAME,
        passwordHash: await hashPassword(env.ADMIN_PASSWORD),
        displayName: env.ADMIN_DISPLAY_NAME,
      },
    })
    console.log(`✔ 已创建管理员：${env.ADMIN_USERNAME}`)
  }

  /* —— 2. 单页内容 —— */
  for (const key of ['site', 'home', 'about', 'cv', 'sections', 'nav', 'ui'] as DocKey[]) {
    const parsed = DOC_SCHEMAS[key].safeParse(data[key])
    if (!parsed.success) {
      console.error(`✗ 文档 ${key} 不符合 schema：`, parsed.error.issues)
      continue
    }
    const payload = JSON.stringify(parsed.data)
    await prisma.siteDoc.upsert({
      where: { key },
      create: { key, data: payload },
      update: { data: payload },
    })
  }
  console.log('✔ 已写入单页内容：site / home / about / cv / sections / nav / ui')

  /* —— 3. 条目 —— */
  for (const e of data.entries) {
    const bodyHtml = renderMarkdown(e.bodyMd)
    const common = {
      kind: e.kind,
      title: e.title,
      tag: e.tag,
      dateLabel: e.dateLabel,
      dateFull: e.dateFull,
      groupLabel: e.groupLabel,
      summary: e.summary,
      bodyMd: e.bodyMd,
      bodyHtml,
      status: e.status,
      sortIndex: e.sortIndex,
      publishedAt: e.status === 'published' ? new Date() : null,
    }
    await prisma.entry.upsert({
      where: { slug: e.slug },
      create: { slug: e.slug, ...common },
      update: common,
    })
  }
  console.log(`✔ 已写入 ${data.entries.length} 条内容`)

  /* —— 4. 照片 —— */
  const photoCount = await prisma.photo.count()
  if (photoCount === 0) {
    await prisma.photo.createMany({ data: data.photos })
    console.log(`✔ 已写入 ${data.photos.length} 张照片占位（到后台上传图片即可填充）`)
  } else {
    console.log(`· 已有 ${photoCount} 张照片，跳过`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n完成。启动开发环境：npm run dev')
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
