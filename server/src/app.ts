import fs from 'node:fs'
import path from 'node:path'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { env, serverRoot } from './env.js'
import { collectPreload, dataPathOf, pageMeta, renderIndexHtml, resolvePage } from './lib/page.js'
import { renderSnapshot } from './lib/prerender.js'
import authPlugin from './plugins/auth.js'
import publicRoutes from './routes/public.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import seoRoutes from './routes/seo.js'

/** 生产构建后前端产物的位置；存在就由本进程一并伺服，部署只需要一个服务 */
const WEB_DIST = path.resolve(serverRoot, '../web/dist')

export async function buildApp() {
  const app = Fastify({
    logger: env.isProd
      ? { level: 'info' }
      : { level: 'info', transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } },
    bodyLimit: 2 * 1024 * 1024,
    trustProxy: true,
  })

  await app.register(rateLimit, { global: false, max: 300, timeWindow: '1 minute' })

  if (env.corsOrigins.length > 0) {
    await app.register(cors, { origin: env.corsOrigins, credentials: true })
  }

  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1 } })
  await app.register(authPlugin)

  // 上传的图片：/uploads/*
  fs.mkdirSync(env.uploadDir, { recursive: true })
  await app.register(fastifyStatic, {
    root: env.uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
    cacheControl: true,
    maxAge: '30d',
  })

  await app.register(publicRoutes, { prefix: '/api' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(adminRoutes, { prefix: '/api/admin' })
  await app.register(seoRoutes)

  // 生产模式：伺服前端构建产物，并对未知路径回落到 index.html（SPA 路由）
  if (fs.existsSync(WEB_DIST)) {
    const indexFile = path.join(WEB_DIST, 'index.html')

    // index.html 不走静态中间件：每一页都要写进各自的标题、描述和预载数据（见 lib/page.ts）
    await app.register(fastifyStatic, {
      root: WEB_DIST,
      prefix: '/',
      decorateReply: false,
      index: false,
      wildcard: false,
      maxAge: '1h',
    })

    // 每次都按这一页现写，所以 HTML 本身不让浏览器缓存。模板很小，直接每次读，重新构建后立即生效
    const sendIndex = async (req: FastifyRequest, reply: FastifyReply) => {
      const { page, pathname } = resolvePage(req.url)
      const [template, preload] = await Promise.all([fs.promises.readFile(indexFile, 'utf8'), collectPreload(app, page)])
      const meta = pageMeta(page, pathname, preload)
      const snapshot = renderSnapshot(page, preload, dataPathOf(page))
      return reply
        .code(meta.found ? 200 : 404)
        .type('text/html; charset=utf-8')
        .header('Cache-Control', 'no-cache')
        .send(renderIndexHtml(template, meta, preload, snapshot))
    }

    // 像文件的地址（图标、扫描器探测的 .php 之类）找不到就是找不到，不回落成网页
    const FILE_LIKE = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|txt|xml|json|js|mjs|css|map|php|aspx?|jsp|env|bak|zip|gz|rar|sql)$/i

    app.get('/', async (req, reply) => sendIndex(req, reply))
    app.setNotFoundHandler(async (req, reply) => {
      const pathOnly = req.url.split('?')[0]!
      if (pathOnly.startsWith('/api/')) return reply.code(404).send({ error: '接口不存在' })
      if (pathOnly.startsWith('/uploads/') || FILE_LIKE.test(pathOnly)) {
        return reply.code(404).type('text/plain; charset=utf-8').send('Not Found')
      }
      return sendIndex(req, reply)
    })
    app.log.info(`前端产物已挂载：${WEB_DIST}`)
  } else {
    app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: '接口不存在' }))
  }

  app.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    req.log.error(err)
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500
    reply.code(status).send({ error: status === 500 ? '服务器内部错误' : err.message })
  })

  return app
}
