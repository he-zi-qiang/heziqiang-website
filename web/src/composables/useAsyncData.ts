import { ref, shallowRef, watch, type Ref } from 'vue'
import { ApiError, type CachedPromise } from '@/api/client'
import { useUi } from './useUi'

/**
 * 最小可用的数据获取：一个 loader + 可选的依赖源。
 * 依赖变化时自动重取，并丢弃过期请求的结果（避免快速切换路由时的竞态）。
 *
 * loader 返回的 Promise 上如果挂着缓存（见 api/client 的 cachedGet），就先同步用缓存渲染：
 * 页面第一帧就是完整的，返回上一页时滚动位置也能正确恢复。之后拿到新数据再替换。
 *
 * 出错时给访客看的永远是「界面文案」里那几句，不会把后端的原始报错吐到页面上——
 * 原始报错留在控制台，方便排查。手上已经有缓存时，刷新失败就继续用旧的，不打扰访客。
 */
export function useAsyncData<T>(loader: () => Promise<T> | CachedPromise<T>, deps?: Ref<unknown>) {
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
    error.value = null
    const pending = loader()
    const cached = (pending as CachedPromise<T>).cached
    if (cached !== undefined) {
      data.value = cached
      loading.value = false
    } else {
      loading.value = true
    }
    try {
      const result = await pending
      if (mine === token) data.value = result
    } catch (err) {
      if (mine !== token) return
      if (cached !== undefined) {
        console.warn('[刷新失败，继续用缓存]', err)
        return
      }
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
