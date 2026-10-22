import { shallowRef } from 'vue'
import { api } from '@/api/client'
import type { Bootstrap } from '@/api/types'

/**
 * 页眉页脚、首页文案、栏目标题——全站共用一份，进站时取一次就够。
 * 多个组件同时调用只会发一个请求。
 * 服务端已经把它写进了 HTML 时（生产环境的首屏），第一次调用就同步拿到，页眉不会先空一下。
 */
const bootstrap = shallowRef<Bootstrap | null>(null)
const error = shallowRef<string | null>(null)
let inflight: Promise<void> | null = null

function load() {
  if (bootstrap.value || inflight) return inflight ?? Promise.resolve()
  const pending = api.bootstrap()
  if (pending.cached) bootstrap.value = pending.cached
  inflight = pending
    .then((data) => {
      bootstrap.value = data
    })
    .catch((err: Error) => {
      // 手上已有（预载或缓存的）数据就继续用，不把页面换成报错
      if (!bootstrap.value) error.value = err.message
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function useSite() {
  void load()
  return { bootstrap, error, reload: () => { bootstrap.value = null; return load() } }
}
