import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const here = path.dirname(fileURLToPath(import.meta.url))
/** server/ 目录：dev 时是 src/.. ，构建后是 dist/.. ，两种情况都对 */
export const serverRoot = path.resolve(here, '..')

dotenv.config({ path: path.join(serverRoot, '.env') })

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // 用 SERVER_PORT 而不是 PORT：开发时前端工具链也在用 PORT，两边会打架。
  // 没设 SERVER_PORT 时才回退到 PORT，方便直接丢进只认 PORT 的托管环境。
  SERVER_PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('127.0.0.1'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET 至少 16 位，生产环境请用随机值'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET 至少 16 位'),
  CORS_ORIGIN: z.string().default(''),
  UPLOAD_DIR: z.string().default('uploads'),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('change-me'),
  ADMIN_DISPLAY_NAME: z.string().default('站长'),
})

const parsed = schema.safeParse({
  ...process.env,
  SERVER_PORT: process.env.SERVER_PORT ?? process.env.PORT,
})
if (!parsed.success) {
  console.error('环境变量校验失败：')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  }
  console.error('提示：把 server/.env.example 复制为 server/.env 再改。')
  process.exit(1)
}

export const env = {
  ...parsed.data,
  PORT: parsed.data.SERVER_PORT,
  isProd: parsed.data.NODE_ENV === 'production',
  /** 上传目录的绝对路径 */
  uploadDir: path.isAbsolute(parsed.data.UPLOAD_DIR)
    ? parsed.data.UPLOAD_DIR
    : path.join(serverRoot, parsed.data.UPLOAD_DIR),
  /** 允许的跨域来源列表，逗号分隔 */
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
}
