import { PrismaClient } from '@prisma/client'
import { env } from './env.js'

/**
 * Prisma 客户端单例。
 * tsx watch 会反复重载模块，挂到 globalThis 上避免连接数无限增长。
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['warn', 'error'] : ['warn', 'error'],
  })

if (!env.isProd) globalForPrisma.prisma = prisma
