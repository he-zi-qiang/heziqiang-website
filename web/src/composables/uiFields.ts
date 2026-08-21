/**
 * 「界面文案」后台表单的字段清单。
 * 用描述式的一张表来驱动表单，比手写三十个 input 好维护——
 * schema 里加一个字段，只要在这里补一行就出现在后台。
 */
export interface UiField {
  path: string
  label: string
  hint?: string
  /** 多行输入 */
  long?: boolean
}

export interface UiGroup {
  title: string
  hint?: string
  fields: UiField[]
}

export const UI_GROUPS: UiGroup[] = [
  {
    title: '页眉',
    hint: '站点顶部那一行。前两项就是「专业 / 个人」两侧的名字。',
    fields: [
      { path: 'header.proLabel', label: '专业一侧的标签' },
      { path: 'header.personalLabel', label: '个人一侧的标签' },
      { path: 'header.toDark', label: '深浅色按钮 · 当前是亮色时的提示' },
      { path: 'header.toLight', label: '深浅色按钮 · 当前是暗色时的提示' },
      { path: 'header.switchAria', label: '身份切换的无障碍名称', hint: '读屏软件会念出来，页面上看不见' },
      { path: 'header.themeAria', label: '深浅色按钮的无障碍名称' },
    ],
  },
  {
    title: '面包屑',
    fields: [
      { path: 'crumb.index', label: '列表页顶部的回首页链接', hint: '整串都会显示，箭头也算在内' },
      { path: 'crumb.backPrefix', label: '内页面包屑的前缀', hint: '后面会自动接上栏目名，如「← 文章 · Writing」' },
    ],
  },
  {
    title: '文章内页',
    fields: [
      { path: 'article.endMark', label: '正文结束符号' },
      { path: 'article.backLabel', label: '返回链接的前缀', hint: '后面会自动接上栏目名，如「← 返回文章」' },
      { path: 'article.nextPrefix', label: '下一篇的前缀' },
      { path: 'article.prevPrefix', label: '上一篇的前缀', hint: '没有下一篇时才会用到' },
      { path: 'article.linkSuffix', label: '前后篇链接的后缀箭头' },
    ],
  },
  {
    title: '简历与照片',
    fields: [
      { path: 'cv.printLabel', label: '简历页的打印链接' },
      { path: 'photos.emptySlot', label: '照片还没传时格子里的字' },
    ],
  },
  {
    title: '状态提示',
    hint: '取数据、出错、没内容时给访客看的话。后端的原始报错不会显示在页面上。',
    fields: [
      { path: 'states.loading', label: '正在加载' },
      { path: 'states.loadFailed', label: '加载失败' },
      { path: 'states.offline', label: '连不上服务器' },
      { path: 'states.notFoundContent', label: '内容不存在' },
      { path: 'states.emptyList', label: '栏目是空的' },
      { path: 'states.emptyPhotos', label: '一张照片都没有' },
    ],
  },
  {
    title: '404 页',
    fields: [
      { path: 'notFound.title', label: '大标题' },
      { path: 'notFound.subtitle', label: '副标题', long: true },
    ],
  },
]

/** 按 'a.b.c' 取值 */
export function getPath(obj: unknown, path: string): string {
  let cur: unknown = obj
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return ''
    cur = (cur as Record<string, unknown>)[key]
  }
  return typeof cur === 'string' ? cur : ''
}

/** 按 'a.b.c' 赋值，路径上缺失的层会补出来 */
export function setPath(obj: Record<string, unknown>, path: string, value: string): void {
  const keys = path.split('.')
  const last = keys.pop()
  if (!last) return
  let cur: Record<string, unknown> = obj
  for (const key of keys) {
    if (typeof cur[key] !== 'object' || cur[key] === null) cur[key] = {}
    cur = cur[key] as Record<string, unknown>
  }
  cur[last] = value
}
