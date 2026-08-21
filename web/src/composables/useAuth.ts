import { ref, shallowRef } from 'vue'
import { api } from '@/api/client'
import type { SessionUser } from '@/api/types'

const user = shallowRef<SessionUser | null>(null)
const checked = ref(false)

/** 会话状态。令牌在 httpOnly cookie 里，前端只关心「我是谁」 */
export function useAuth() {
  async function refresh() {
    try {
      user.value = (await api.auth.me()).user
    } catch {
      user.value = null
    } finally {
      checked.value = true
    }
    return user.value
  }

  async function login(username: string, password: string) {
    user.value = (await api.auth.login(username, password)).user
    checked.value = true
    return user.value
  }

  async function logout() {
    await api.auth.logout().catch(() => {})
    user.value = null
  }

  return { user, checked, refresh, login, logout }
}
