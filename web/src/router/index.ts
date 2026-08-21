import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { EntryKind } from '@/api/types'
import { useAuth } from '@/composables/useAuth'

/** URL 片段 ↔ 栏目。与后端 lib/kinds.ts 保持一致 */
export const PATH_BY_KIND: Record<EntryKind, string> = {
  writing: 'writing',
  project: 'projects',
  essay: 'essays',
  reading: 'reading',
  learning: 'learning',
}

export const SECTION_BY_KIND: Record<EntryKind, 'pro' | 'personal'> = {
  writing: 'pro',
  project: 'pro',
  essay: 'personal',
  reading: 'personal',
  learning: 'personal',
}

/** 列表栏目：有内页的（文章/项目/随笔）额外注册一条 :slug 路由 */
const LIST_ROUTES: { kind: EntryKind; detail: boolean }[] = [
  { kind: 'writing', detail: true },
  { kind: 'project', detail: true },
  { kind: 'essay', detail: true },
  { kind: 'reading', detail: false },
  { kind: 'learning', detail: false },
]

const listRoutes: RouteRecordRaw[] = LIST_ROUTES.flatMap(({ kind, detail }) => {
  const path = PATH_BY_KIND[kind]
  const routes: RouteRecordRaw[] = [
    {
      path: `/${path}`,
      name: `list-${kind}`,
      component: () => import('@/views/EntryListView.vue'),
      props: { kind },
      meta: { section: SECTION_BY_KIND[kind], layout: 'site' },
    },
  ]
  if (detail) {
    routes.push({
      path: `/${path}/:slug`,
      name: `detail-${kind}`,
      component: () => import('@/views/EntryDetailView.vue'),
      props: (route) => ({ kind, slug: String(route.params.slug) }),
      meta: { section: SECTION_BY_KIND[kind], layout: 'site' },
    })
  }
  return routes
})

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { layout: 'site', home: true },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { section: 'pro', layout: 'site' },
  },
  {
    path: '/cv',
    name: 'cv',
    component: () => import('@/views/CvView.vue'),
    meta: { section: 'pro', layout: 'site' },
  },
  {
    path: '/photos',
    name: 'photos',
    component: () => import('@/views/PhotosView.vue'),
    meta: { section: 'personal', layout: 'site' },
  },
  ...listRoutes,

  /* —— 后台 —— */
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/LoginView.vue'),
    meta: { layout: 'bare' },
  },
  {
    path: '/admin',
    name: 'admin-home',
    component: () => import('@/views/admin/DashboardView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/admin/entries',
    name: 'admin-entries',
    component: () => import('@/views/admin/EntriesView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/admin/entries/new',
    name: 'admin-entry-new',
    component: () => import('@/views/admin/EntryEditView.vue'),
    props: { id: null },
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/admin/entries/:id(\\d+)',
    name: 'admin-entry-edit',
    component: () => import('@/views/admin/EntryEditView.vue'),
    props: (route) => ({ id: Number(route.params.id) }),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/admin/pages/:key',
    name: 'admin-doc',
    component: () => import('@/views/admin/DocEditView.vue'),
    props: (route) => ({ docKey: String(route.params.key) }),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/admin/photos',
    name: 'admin-photos',
    component: () => import('@/views/admin/PhotosAdminView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },
  {
    path: '/admin/account',
    name: 'admin-account',
    component: () => import('@/views/admin/AccountView.vue'),
    meta: { layout: 'admin', requiresAuth: true },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { layout: 'site' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const { user, checked, refresh } = useAuth()
  if (!checked.value) await refresh()
  if (user.value) return true
  return { name: 'admin-login', query: { next: to.fullPath } }
})
