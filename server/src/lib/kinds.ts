/**
 * 栏目定义 —— 前后端共享的一份事实来源（前端有一份同名副本用于路由）。
 * section 决定它属于「专业 / 个人」哪一侧，前端据此决定页眉高亮与面包屑回链。
 */
export const ENTRY_KINDS = {
  writing: { label: '文章', en: 'Writing', section: 'pro', path: 'writing' },
  project: { label: '项目', en: 'Projects', section: 'pro', path: 'projects' },
  essay: { label: '随笔', en: 'Essays', section: 'personal', path: 'essays' },
  reading: { label: '阅读笔记', en: 'Reading', section: 'personal', path: 'reading' },
  learning: { label: '学习记录', en: 'Learning Log', section: 'personal', path: 'learning' },
} as const

export type EntryKind = keyof typeof ENTRY_KINDS
export const ENTRY_KIND_LIST = Object.keys(ENTRY_KINDS) as EntryKind[]

export function isEntryKind(v: unknown): v is EntryKind {
  return typeof v === 'string' && v in ENTRY_KINDS
}
