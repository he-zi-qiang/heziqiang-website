import { ref, shallowRef, watch, type Ref } from 'vue'
import { ApiError } from '@/api/client'

/**
 * 最小可用的数据获取：一个 loader + 可选的依赖源。
 * 依赖变化时自动重取，并丢弃过期请求的结果（避免快速切换路由时的竞态）。
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps?: Ref<unknown>) {
  const data = shallowRef<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(true)
  let token = 0

  async function run() {
    const mine = ++token
    loading.value = true
    error.value = null
    try {
      const result = await loader()
      if (mine === token) data.value = result
    } catch (err) {
      if (mine !== token) return
      error.value = err instanceof ApiError ? err.message : '加载失败'
      data.value = null
    } finally {
      if (mine === token) loading.value = false
    }
  }

  void run()
  if (deps) watch(deps, () => void run())

  return { data, error, loading, reload: run }
}
