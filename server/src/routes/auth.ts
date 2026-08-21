import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../db.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { loginSchema, passwordChangeSchema } from '../schemas/entry.js'

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', {
    config: { rateLimit: { max: 8, timeWindow: '5 minutes' } },
  }, async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数不正确' })
    }
    const user = await prisma.user.findUnique({ where: { username: parsed.data.username } })
    // 用户不存在时也走一次哈希校验，避免用响应时间区分「用户名对不对」
    const ok = user
      ? await verifyPassword(parsed.data.password, user.passwordHash)
      : await verifyPassword(parsed.data.password, await hashPassword('decoy'))
    if (!user || !ok) {
      return reply.code(401).send({ error: '用户名或密码不正确' })
    }
    const session = { id: user.id, username: user.username, displayName: user.displayName }
    await app.issueSession(reply, session)
    return { user: session }
  })

  app.post('/logout', async (_req, reply) => {
    app.clearSession(reply)
    return { ok: true }
  })

  app.get('/me', { preHandler: app.requireAuth }, async (req) => ({ user: req.currentUser }))

  app.post('/password', { preHandler: app.requireAuth }, async (req, reply) => {
    const parsed = passwordChangeSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? '参数不正确' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.currentUser!.id } })
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return reply.code(401).send({ error: '当前密码不正确' })
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    })
    return { ok: true }
  })
}

export default authRoutes
