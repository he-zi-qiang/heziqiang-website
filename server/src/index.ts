import { buildApp } from './app.js'
import { env } from './env.js'
import { prisma } from './db.js'

const app = await buildApp()

try {
  await app.listen({ port: env.PORT, host: env.HOST })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    app.log.info(`收到 ${signal}，正在关闭…`)
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  })
}
