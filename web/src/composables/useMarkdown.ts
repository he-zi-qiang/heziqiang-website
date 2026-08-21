import MarkdownIt from 'markdown-it'

/**
 * 与后端同款配置，只用于后台编辑器的实时预览。
 * 站点的公开页面拿到的正文已经由后端渲染好，不会加载到这个文件——
 * 它只存在于后台那个懒加载分块里。
 */
const md = new MarkdownIt({ html: true, linkify: true, breaks: false, typographer: false })

export function renderMarkdown(source: string): string {
  return source.trim() ? md.render(source) : ''
}
