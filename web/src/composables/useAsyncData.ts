import { ref, shallowRef, watch, type Ref } from 'vue'
import { ApiError } from '@/api/client'
import { useUi } from './useUi'

/**
 * 最小可用的数据获取：一个 loader + 可选的依赖源。
 * 依赖变化时自动重取，并丢弃过期请求的结果（避免快速切换路由时的竞态）。
 *
 * 出错时给访客看的永远是「界面文案」里那几句，不会把后端的原始报错吐到页面上——
 * 原始报错留在控制台，方便排查。
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps?: Ref<unknown>) {
  const { ui } = useUi()
  const data = shallowRef<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(true)
  let token = 0

  function messageFor(err: unknown): string {
    const states = ui.value.states
    if (err instanceof ApiError) {
      if (err.status === 0) return states.offline
      if (err.status === 404) return states.notFoundContent
    }
    return states.loadFailed
  }

  async function run() {
    const mine = ++token
    loading.value = true
    error.value = null
    try {
      const result = await loader()
      if (mine === token) data.value = result
    } catch (err) {
      if (mine !== token) return
      console.error('[取数失败]', err)
      error.value = messageFor(err)
      data.value = null
    } finally {
      if (mine === token) loading.value = false
    }
  }

  void run()
  if (deps) watch(deps, () => void run())

  return { data, error, loading, reload: run }
}
