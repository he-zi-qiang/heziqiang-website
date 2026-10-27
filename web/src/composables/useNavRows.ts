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

/**
 * 某一侧身份的索引行（首页正文里的索引、宽屏左栏的导航共用）。
 * 还没有内容的栏目不出现，免得访客点进去扑个空。
 */
export function useNavRows(mode: Ref<Mode>) {
  const { bootstrap } = useSite()
  const { nav } = useUi()

  function hasContent(row: NavRow) {
    const counts = bootstrap.value?.counts
    const section = SECTION_BY_PATH.get(row.to.split(/[?#]/)[0]!)
    return !counts || !section || counts[section] > 0
  }

  return computed(() => (nav.value[mode.value] ?? []).filter(hasContent))
}
