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
  return payload as T
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  bootstrap: () => request<Bootstrap>('/bootstrap'),

  doc: {
    site: () => request<SiteDoc>('/docs/site'),
    home: () => request<HomeDoc>('/docs/home'),
    about: () => request<AboutDoc>('/docs/about'),
    cv: () => request<CvDoc>('/docs/cv'),
    sections: () => request<SectionsDoc>('/docs/sections'),
  },

  entries: (kind?: EntryKind) =>
    request<EntryListResponse>(`/entries${kind ? `?kind=${kind}` : ''}`),
  entry: (slug: string) => request<EntryDetail>(`/entries/${encodeURIComponent(slug)}`),
  photos: () => request<{ items: Photo[] }>('/photos'),

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
