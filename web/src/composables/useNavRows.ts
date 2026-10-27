import { computed, type Ref } from 'vue'
import type { EntryKind, NavRow } from '@/api/types'
import type { Mode } from '@/composables/useMode'
import { useSite } from '@/composables/useSite'
import { useUi } from '@/composables/useUi'
import { PATH_BY_KIND } from '@/router'

/** 索引行指向的栏目：/essays → essay，/photos → photos；关于、简历这类单页不算 */
const SECTION_BY_PATH = new Map<string, EntryKind | 'photos'>([
  ...(Object.entries(PATH_BY_KIND) as [EntryKind, string][]).map(([kind, path]) => [`/${path}`, kind] as const),
  ['/photos', 'photos'],
])

export type NavRowWithCount = NavRow & { count?: number; section?: EntryKind | 'photos' }

/**
 * 某一侧身份的索引行（首页的栏目卡片、宽屏左栏的导航共用），栏目类的行带上条数和栏目（用来取栏目色）。
 * 还没有内容的栏目不出现，免得访客点进去扑个空。
 */
export function useNavRows(mode: Ref<Mode>) {
  const { bootstrap } = useSite()
  const { nav } = useUi()

  return computed<NavRowWithCount[]>(() => {
    const counts = bootstrap.value?.counts
    return (nav.value[mode.value] ?? []).flatMap((row) => {
      const section = SECTION_BY_PATH.get(row.to.split(/[?#]/)[0]!)
      if (!counts || !section) return [row]
      return counts[section] > 0 ? [{ ...row, count: counts[section], section }] : []
    })
  })
}
