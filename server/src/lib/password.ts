import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>

const KEYLEN = 64

/**
 * 用 Node 内置的 scrypt 做口令哈希——不引入任何原生依赖，
 * 服务器上不需要编译，2 核小机器也扛得住（登录是低频操作）。
 * 存储格式：scrypt$<salt-hex>$<hash-hex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, KEYLEN)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[1] ?? '', 'hex')
  const expected = Buffer.from(parts[2] ?? '', 'hex')
  if (salt.length === 0 || expected.length !== KEYLEN) return false
  const actual = await scryptAsync(password, salt, KEYLEN)
  return timingSafeEqual(actual, expected)
}
