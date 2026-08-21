/**
 * 生成 URL 片段。中文标题拿不到好看的英文 slug，
 * 所以中文一律走 pinyin-less 的保底策略：保留字母数字，其余压成连字符；
 * 如果结果为空（纯中文标题），交给调用方补一个前缀 + 时间戳。
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function fallbackSlug(prefix = 'entry'): string {
  return `${prefix}-${Date.now().toString(36)}`
}
