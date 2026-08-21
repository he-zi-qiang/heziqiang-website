import fp from 'fastify-plugin'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../env.js'

export const SESSION_COOKIE = 'hz_session'
const SESSION_TTL = '7d'

declare module 'fastify' {
  interface FastifyInstance {
    /** 挂在受保护路由的 preHandler 上；未登录直接 401 */
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    issueSession: (reply: FastifyReply, payload: SessionUser) => Promise<void>
    clearSession: (reply: FastifyReply) => void
  }
  interface FastifyRequest {
    currentUser?: SessionUser
  }
}

export type SessionUser = { id: number; username: string; displayName: string }

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(cookie, { secret: env.COOKIE_SECRET })
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    // 只认 httpOnly cookie 里的令牌：不放在 localStorage，XSS 偷不走
    cookie: { cookieName: SESSION_COOKIE, signed: false },
  })

  app.decorate('requireAuth', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await req.jwtVerify<SessionUser>()
      req.currentUser = payload
    } catch {
      return reply.code(401).send({ error: '未登录或登录已过期' })
    }
  })

  app.decorate('issueSession', async (reply: FastifyReply, payload: SessionUser) => {
    const token = await reply.jwtSign(payload, { expiresIn: SESSION_TTL })
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProd,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  })

  app.decorate('clearSession', (reply: FastifyReply) => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' })
  })
}

export default fp(plugin, { name: 'auth' })
