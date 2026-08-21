import fs from 'node:fs'
import path from 'node:path'
import Fastify, { type FastifyReply } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { env, serverRoot } from './env.js'
import { getIndexHtml } from './lib/index-html.js'
import authPlugin from './plugins/auth.js'
import publicRoutes from './routes/public.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'

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

  // 生产模式：伺服前端构建产物，并对未知路径回落到 index.html（SPA 路由）
  if (fs.existsSync(WEB_DIST)) {
    const indexFile = path.join(WEB_DIST, 'index.html')

    // index.html 不走静态中间件：它要按「站点信息」文档补上标题与描述
    await app.register(fastifyStatic, {
      root: WEB_DIST,
      prefix: '/',
      decorateReply: false,
      index: false,
      wildcard: false,
      maxAge: '1h',
    })

    const sendIndex = async (reply: FastifyReply) =>
      reply.type('text/html; charset=utf-8').send(await getIndexHtml(indexFile))

    app.get('/', async (_req, reply) => sendIndex(reply))
    app.setNotFoundHandler(async (req, reply) => {
      if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
        return reply.code(404).send({ error: '接口不存在' })
      }
      return sendIndex(reply)
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
