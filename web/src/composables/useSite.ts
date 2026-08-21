import { shallowRef } from 'vue'
import { api } from '@/api/client'
import type { Bootstrap } from '@/api/types'

/**
 * 页眉页脚、首页文案、栏目标题——全站共用一份，进站时取一次就够。
 * 多个组件同时调用只会发一个请求。
 */
const bootstrap = shallowRef<Bootstrap | null>(null)
const error = shallowRef<string | null>(null)
let inflight: Promise<void> | null = null

function load() {
  if (bootstrap.value || inflight) return inflight ?? Promise.resolve()
  inflight = api
    .bootstrap()
    .then((data) => {
      bootstrap.value = data
    })
    .catch((err: Error) => {
      error.value = err.message
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
