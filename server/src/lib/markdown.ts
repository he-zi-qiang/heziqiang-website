import MarkdownIt from 'markdown-it'

/**
 * 正文渲染器。html:true 是有意的——正文只有站长本人能写，
 * 允许他在 Markdown 里插入 <figure>、<abbr> 这类排版需要的标签。
 */
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  typographer: false, // 中文排版不要英文智能引号
})

// 站外链接一律新窗口打开，并加上 rel 防止 opener 泄漏
const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, envArg, self) => {
  const token = tokens[idx]
  const href = token?.attrGet('href') ?? ''
  if (/^https?:\/\//i.test(href)) {
    token?.attrSet('target', '_blank')
    token?.attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpen(tokens, idx, options, envArg, self)
}

export function renderMarkdown(source: string): string {
  if (!source.trim()) return ''
  return md.render(source)
}

/** 行内片段：首页引言、关于/简历的 k-v 值——不要外面那层 <p> */
export function renderInline(source: string): string {
  if (!source.trim()) return ''
  return md.renderInline(source)
}

/** 从 Markdown 里粗略抽一段纯文本，用作缺省摘要 / SEO 描述 */
export function excerpt(source: string, max = 140): string {
  const text = source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}
