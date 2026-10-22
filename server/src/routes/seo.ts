import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { ENTRY_KINDS, ENTRY_KIND_LIST, isEntryKind } from '../lib/kinds.js'

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 给搜索引擎看的两样东西：robots.txt 和 sitemap.xml。以前这两个地址回的是网页本身 */
const seoRoutes: FastifyPluginAsync = async (app) => {
  app.get('/robots.txt', async (_req, reply) => {
    reply.type('text/plain; charset=utf-8')
    return ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/admin/', '', `Sitemap: ${env.siteUrl}/sitemap.xml`, ''].join(
      '\n',
    )
  })

  /** 首页、关于、简历，有内容的栏目页，以及每一篇有正文的条目 */
  app.get('/sitemap.xml', async (_req, reply) => {
    const [entries, photos] = await Promise.all([
      prisma.entry.findMany({
        where: { status: 'published' },
        select: { kind: true, slug: true, bodyHtml: true, updatedAt: true },
      }),
      prisma.photo.count(),
    ])

    const urls: { loc: string; lastmod?: Date }[] = [
      { loc: '/' },
      { loc: '/about' },
      { loc: '/cv' },
    ]
    const kindsWithContent = new Set(entries.map((e) => e.kind))
    for (const kind of ENTRY_KIND_LIST) {
      if (kindsWithContent.has(kind)) urls.push({ loc: `/${ENTRY_KINDS[kind].path}` })
    }
    if (photos > 0) urls.push({ loc: '/photos' })
    for (const e of entries) {
      if (!e.bodyHtml || !isEntryKind(e.kind)) continue
      urls.push({ loc: `/${ENTRY_KINDS[e.kind].path}/${encodeURIComponent(e.slug)}`, lastmod: e.updatedAt })
    }

    const body = urls
      .map(({ loc, lastmod }) => {
        const mod = lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''
        return `  <url><loc>${xmlEscape(env.siteUrl + loc)}</loc>${mod}</url>`
      })
      .join('\n')
    reply.type('application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  })
}

export default seoRoutes
