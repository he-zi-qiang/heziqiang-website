import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createWriteStream } from 'node:fs'
import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { readDoc, writeDoc } from '../lib/docs.js'
import { resetIndexHtml } from '../lib/index-html.js'
import { ENTRY_KINDS } from '../lib/kinds.js'
import { renderMarkdown } from '../lib/markdown.js'
import { fallbackSlug, slugify } from '../lib/slug.js'
import { toEntryAdmin, toPhoto } from '../lib/serialize.js'
import { isDocKey } from '../schemas/docs.js'
import {
  entryCreateSchema,
  entryUpdateSchema,
  photoCreateSchema,
  photoUpdateSchema,
} from '../schemas/entry.js'

const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
}

/** 后台接口：全部需要登录 */
const adminRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.requireAuth)

  /* ---------------- 条目 ---------------- */

  app.get('/entries', async (req) => {
    const { kind, status } = req.query as { kind?: string; status?: string }
    const rows = await prisma.entry.findMany({
      where: { ...(kind ? { kind } : {}), ...(status ? { status } : {}) },
      orderBy: [{ kind: 'asc' }, { sortIndex: 'asc' }, { id: 'asc' }],
    })
    return { items: rows.map(toEntryAdmin), kinds: ENTRY_KINDS }
  })

  app.get('/entries/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const entry = await prisma.entry.findUnique({ where: { id } })
    if (!entry) return reply.code(404).send({ error: '条目不存在' })
    return toEntryAdmin(entry)
  })

  app.post('/entries', async (req, reply) => {
    const parsed = entryCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数不正确' })
    }
    const input = parsed.data
    const slug = await uniqueSlug(input.slug || slugify(input.title) || fallbackSlug(input.kind))
    const entry = await prisma.entry.create({
      data: {
        kind: input.kind,
        slug,
        title: input.title,
        tag: input.tag ?? null,
        dateLabel: input.dateLabel,
        dateFull: input.dateFull ?? null,
        groupLabel: input.groupLabel ?? null,
        summary: input.summary,
        bodyMd: input.bodyMd,
        bodyHtml: renderMarkdown(input.bodyMd),
        status: input.status,
        sortIndex: input.sortIndex,
        publishedAt: input.status === 'published' ? new Date() : null,
      },
    })
    return reply.code(201).send(toEntryAdmin(entry))
  })

  app.patch('/entries/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const current = await prisma.entry.findUnique({ where: { id } })
    if (!current) return reply.code(404).send({ error: '条目不存在' })

    const parsed = entryUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数不正确' })
    }
    const input = parsed.data

    const data: Record<string, unknown> = {}
    if (input.kind !== undefined) data.kind = input.kind
    if (input.title !== undefined) data.title = input.title
    if (input.tag !== undefined) data.tag = input.tag ?? null
    if (input.dateLabel !== undefined) data.dateLabel = input.dateLabel
    if (input.dateFull !== undefined) data.dateFull = input.dateFull ?? null
    if (input.groupLabel !== undefined) data.groupLabel = input.groupLabel ?? null
    if (input.summary !== undefined) data.summary = input.summary
    if (input.sortIndex !== undefined) data.sortIndex = input.sortIndex
    if (input.bodyMd !== undefined) {
      data.bodyMd = input.bodyMd
      data.bodyHtml = renderMarkdown(input.bodyMd)
    }
    if (input.slug !== undefined && input.slug && input.slug !== current.slug) {
      data.slug = await uniqueSlug(input.slug, id)
    }
    if (input.status !== undefined) {
      data.status = input.status
      // 第一次发布时记下发布时间，之后再编辑不覆盖
      if (input.status === 'published' && !current.publishedAt) data.publishedAt = new Date()
      if (input.status === 'draft') data.publishedAt = null
    }

    const entry = await prisma.entry.update({ where: { id }, data })
    return toEntryAdmin(entry)
  })

  app.delete('/entries/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const found = await prisma.entry.findUnique({ where: { id } })
    if (!found) return reply.code(404).send({ error: '条目不存在' })
    await prisma.entry.delete({ where: { id } })
    return { ok: true }
  })

  /** 批量调整同栏目内的顺序 */
  app.post('/entries/reorder', async (req, reply) => {
    const body = req.body as { ids?: unknown }
    if (!Array.isArray(body?.ids) || body.ids.some((v) => typeof v !== 'number')) {
      return reply.code(400).send({ error: 'ids 必须是一个数字数组' })
    }
    const ids = body.ids as number[]
    await prisma.$transaction(
      ids.map((id, index) => prisma.entry.update({ where: { id }, data: { sortIndex: index } })),
    )
    return { ok: true }
  })

  /* ---------------- 单页文档 ---------------- */

  /** 后台读到的是 Markdown 源码，公开接口读到的是渲染后的 HTML —— 编辑改的永远是源码 */
  app.get('/docs/:key', async (req, reply) => {
    const { key } = req.params as { key: string }
    if (!isDocKey(key)) return reply.code(404).send({ error: `未知文档：${key}` })
    const doc = await readDoc(key)
    if (!doc) return reply.code(404).send({ error: '该文档还没有内容' })
    return doc
  })

  app.put('/docs/:key', async (req, reply) => {
    const { key } = req.params as { key: string }
    if (!isDocKey(key)) return reply.code(404).send({ error: `未知文档：${key}` })
    try {
      const saved = await writeDoc(key, req.body)
      // 站名和描述会被写进 index.html，缓存要作废
      if (key === 'site') resetIndexHtml()
      return saved
    } catch (err) {
      const e = err as Error & { issues?: unknown }
      return reply.code(400).send({ error: e.message, issues: e.issues })
    }
  })

  /* ---------------- 照片 ---------------- */

  app.get('/photos', async () => {
    const rows = await prisma.photo.findMany({ orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] })
    return { items: rows.map(toPhoto) }
  })

  app.post('/photos', async (req, reply) => {
    const parsed = photoCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数不正确' })
    }
    const photo = await prisma.photo.create({ data: parsed.data })
    return reply.code(201).send(toPhoto(photo))
  })

  app.patch('/photos/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const parsed = photoUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数不正确' })
    }
    const found = await prisma.photo.findUnique({ where: { id } })
    if (!found) return reply.code(404).send({ error: '照片不存在' })
    const photo = await prisma.photo.update({ where: { id }, data: parsed.data })
    return toPhoto(photo)
  })

  app.delete('/photos/:id', async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const found = await prisma.photo.findUnique({ where: { id } })
    if (!found) return reply.code(404).send({ error: '照片不存在' })
    await prisma.photo.delete({ where: { id } })
    return { ok: true }
  })

  /* ---------------- 上传 ---------------- */

  app.post('/uploads', async (req, reply) => {
    const file = await req.file()
    if (!file) return reply.code(400).send({ error: '没有收到文件' })
    if (!ALLOWED_IMAGE.has(file.mimetype)) {
      return reply.code(415).send({ error: `不支持的文件类型：${file.mimetype}` })
    }

    await fs.mkdir(env.uploadDir, { recursive: true })
    const ext = EXT_BY_MIME[file.mimetype] ?? path.extname(file.filename) ?? '.bin'
    const name = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}${ext}`
    const target = path.join(env.uploadDir, name)

    const hash = createHash('sha256')
    file.file.on('data', (chunk: Buffer) => hash.update(chunk))
    await pipeline(file.file, createWriteStream(target))

    if (file.file.truncated) {
      await fs.rm(target, { force: true })
      return reply.code(413).send({ error: '文件超过大小上限' })
    }

    const stat = await fs.stat(target)
    return reply.code(201).send({
      url: `/uploads/${name}`,
      filename: file.filename,
      size: stat.size,
      mimetype: file.mimetype,
      sha256: hash.digest('hex').slice(0, 16),
    })
  })

  app.get('/uploads', async () => {
    await fs.mkdir(env.uploadDir, { recursive: true })
    const names = await fs.readdir(env.uploadDir)
    const items = await Promise.all(
      names
        .filter((n) => !n.startsWith('.'))
        .map(async (n) => {
          const stat = await fs.stat(path.join(env.uploadDir, n))
          return { url: `/uploads/${n}`, name: n, size: stat.size, mtime: stat.mtime }
        }),
    )
    items.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    return { items }
  })

  /* ---------------- 概览 ---------------- */

  app.get('/stats', async () => {
    const [byKind, drafts, photos] = await Promise.all([
      prisma.entry.groupBy({ by: ['kind'], _count: { _all: true } }),
      prisma.entry.count({ where: { status: 'draft' } }),
      prisma.photo.count(),
    ])
    return {
      byKind: Object.fromEntries(byKind.map((r) => [r.kind, r._count._all])),
      drafts,
      photos,
    }
  })
}

/** slug 必须全站唯一；冲突时自动加后缀 */
async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  const clean = slugify(base) || fallbackSlug()
  let candidate = clean
  let n = 2
  for (;;) {
    const found = await prisma.entry.findUnique({ where: { slug: candidate } })
    if (!found || found.id === ignoreId) return candidate
    candidate = `${clean}-${n++}`
  }
}

export default adminRoutes
