import { computed } from 'vue'
import type { EntryKind, NavDoc, UiDoc } from '@/api/types'
import { useSite } from './useSite'

/**
 * 界面文案。全部来自后台的「界面文案」文档，
 * 这里的默认值只是文档还没取到时的兜底，改文案请去后台而不是改这里。
 */
const FALLBACK: UiDoc = {
  header: {
    proLabel: 'Professional',
    personalLabel: 'Personal',
    switchAria: '身份切换',
    themeAria: '切换深浅色',
    toLight: '切换到明亮 · Light',
    toDark: '切换到暗色 · Dark',
  },
  crumb: { index: '← 索引 · Index', backPrefix: '←' },
  article: {
    endMark: '❡',
    backLabel: '← 返回',
    nextPrefix: '下一篇：',
    prevPrefix: '上一篇：',
    linkSuffix: '→',
  },
  cv: { printLabel: '打印 / 存为 PDF' },
  photos: { emptySlot: '待补图' },
  states: {
    loading: '正在取内容…',
    loadFailed: '加载失败',
    offline: '连不上服务器，请稍后再试。',
    emptyList: '这个栏目还没有内容。',
    emptyPhotos: '还没有照片。',
    notFoundContent: '找不到这篇内容。',
  },
  notFound: { title: '404', subtitle: '', links: [] },
}

const FALLBACK_NAV: NavDoc = { pro: [], personal: [] }

export function useUi() {
  const { bootstrap } = useSite()

  const ui = computed<UiDoc>(() => bootstrap.value?.ui ?? FALLBACK)
  const nav = computed<NavDoc>(() => bootstrap.value?.nav ?? FALLBACK_NAV)

  /** 栏目的短名称与英文名，面包屑和内页 meta 用 */
  function sectionOf(kind: EntryKind | 'photos') {
    const meta = bootstrap.value?.sections?.[kind]
    if (!meta) return { title: '', subtitle: '', label: '', en: '' }
    return { ...meta, label: meta.label || meta.title }
  }

  return { ui, nav, sectionOf }
}
