import type {
  AboutDoc, AdminStats, Bootstrap, CvDoc, EntryAdmin, EntryDetail, EntryKind,
  EntryListResponse, HomeDoc, Photo, SectionsDoc, SessionUser, SiteDoc, UploadResult,
} from './types'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 统一的请求封装。前端永远只写相对路径 /api/...：
 * 开发时 Vite 反代到 3001，生产时 nginx（或后端自己）伺服同源，代码不用改。
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const isForm = init.body instanceof FormData
  if (init.body && !isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let res: Response
  try {
    res = await fetch(`/api${path}`, { credentials: 'same-origin', ...init, headers })
  } catch {
    // status 0 = 根本没连上。给访客看什么由 useAsyncData 按「界面文案」决定，
    // 这里只留一句给开发者看的。
    throw new ApiError(0, 'network unreachable')
  }

  if (res.status === 204) return undefined as T

  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `请求失败（${res.status}）`
    throw new ApiError(res.status, message)
  }
  // 后台改了任何东西，前台缓存的公开内容就可能过时了
  if (init.method && init.method !== 'GET') cache.clear()
  return payload as T
}

/* ---------------- 公开内容的缓存 ----------------
 * 访客在站里来回点，同一份数据没必要每次都干等服务器：
 *  - 首屏：服务端把这一页要用的数据直接写进 HTML（window.__PRELOAD__），省掉一轮请求；
 *  - 站内跳转：取过的数据先拿来渲染，旧了再在后台悄悄刷新；
 *  - 鼠标停到链接上就预取（见 useInternalLinks），点下去时数据多半已经在了。
 * 只缓存公开的 GET，后台接口一律直连。
 */

declare global {
  interface Window {
    __PRELOAD__?: Record<string, unknown>
  }
}

/** 公开接口的路径。缓存、预取和服务端预载（server/src/lib/preload.ts）都按这串字符对齐 */
export const publicPath = {
  bootstrap: '/bootstrap',
  about: '/docs/about',
  cv: '/docs/cv',
  photos: '/photos',
  entries: (kind: EntryKind) => `/entries?kind=${kind}`,
  entry: (slug: string) => `/entries/${encodeURIComponent(slug)}`,
}

/** 多久之内的缓存算新鲜：新鲜的直接用，旧的先用着、同时后台刷新 */
const FRESH_MS = 60_000

const cache = new Map<string, { at: number; data: unknown }>()
const inflight = new Map<string, Promise<unknown>>()

for (const [path, data] of Object.entries(window.__PRELOAD__ ?? {})) {
  cache.set(path, { at: Date.now(), data })
}

/** 带缓存的请求：Promise 上挂着已有的缓存，useAsyncData 拿它同步渲染，不闪「加载中」 */
export type CachedPromise<T> = Promise<T> & { cached?: T }

function fetchFresh<T>(path: string): Promise<T> {
  let pending = inflight.get(path) as Promise<T> | undefined
  if (!pending) {
    pending = request<T>(path)
      .then((data) => {
        cache.set(path, { at: Date.now(), data })
        return data
      })
      .finally(() => inflight.delete(path))
    inflight.set(path, pending)
  }
  return pending
}

function cachedGet<T>(path: string): CachedPromise<T> {
  const hit = cache.get(path)
  const fresh = hit && Date.now() - hit.at < FRESH_MS
  const promise = fresh ? Promise.resolve(hit.data as T) : fetchFresh<T>(path)
  return Object.assign(promise, { cached: hit?.data as T | undefined })
}

/** 预取：缓存里没有或已经旧了才发请求，失败也无所谓 */
export function prefetch(path: string) {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < FRESH_MS) return
  fetchFresh(path).catch(() => {})
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  bootstrap: () => cachedGet<Bootstrap>(publicPath.bootstrap),

  doc: {
    site: () => request<SiteDoc>('/docs/site'),
    home: () => request<HomeDoc>('/docs/home'),
    about: () => cachedGet<AboutDoc>(publicPath.about),
    cv: () => cachedGet<CvDoc>(publicPath.cv),
    sections: () => request<SectionsDoc>('/docs/sections'),
  },

  entries: (kind?: EntryKind) =>
    kind ? cachedGet<EntryListResponse>(publicPath.entries(kind)) : request<EntryListResponse>('/entries'),
  entry: (slug: string) => cachedGet<EntryDetail>(publicPath.entry(slug)),
  photos: () => cachedGet<{ items: Photo[] }>(publicPath.photos),

  auth: {
    login: (username: string, password: string) =>
      request<{ user: SessionUser }>('/auth/login', { method: 'POST', body: json({ username, password }) }),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: SessionUser }>('/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: true }>('/auth/password', { method: 'POST', body: json({ currentPassword, newPassword }) }),
  },

  admin: {
    stats: () => request<AdminStats>('/admin/stats'),
    entries: (params: { kind?: string; status?: string } = {}) => {
      const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])
      return request<{ items: EntryAdmin[] }>(`/admin/entries${q.toString() ? `?${q}` : ''}`)
    },
    entry: (id: number) => request<EntryAdmin>(`/admin/entries/${id}`),
    createEntry: (body: Partial<EntryAdmin>) =>
      request<EntryAdmin>('/admin/entries', { method: 'POST', body: json(body) }),
    updateEntry: (id: number, body: Partial<EntryAdmin>) =>
      request<EntryAdmin>(`/admin/entries/${id}`, { method: 'PATCH', body: json(body) }),
    deleteEntry: (id: number) => request<{ ok: true }>(`/admin/entries/${id}`, { method: 'DELETE' }),
    reorder: (ids: number[]) =>
      request<{ ok: true }>('/admin/entries/reorder', { method: 'POST', body: json({ ids }) }),

    doc: <T>(key: string) => request<T>(`/admin/docs/${key}`),
    putDoc: <T>(key: string, body: T) =>
      request<T>(`/admin/docs/${key}`, { method: 'PUT', body: json(body) }),

    photos: () => request<{ items: Photo[] }>('/admin/photos'),
    createPhoto: (body: Partial<Photo>) =>
      request<Photo>('/admin/photos', { method: 'POST', body: json(body) }),
    updatePhoto: (id: number, body: Partial<Photo>) =>
      request<Photo>(`/admin/photos/${id}`, { method: 'PATCH', body: json(body) }),
    deletePhoto: (id: number) => request<{ ok: true }>(`/admin/photos/${id}`, { method: 'DELETE' }),

    upload: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<UploadResult>('/admin/uploads', { method: 'POST', body: form })
    },
    uploads: () =>
      request<{ items: { url: string; name: string; size: number; mtime: string }[] }>('/admin/uploads'),
  },
}
