import { renderInline, renderMarkdown } from './markdown.js'
import type { AboutDocData, CvDocData, HomeDocData } from '../schemas/docs.js'

/**
 * 单页文档里也有 Markdown（首页引言的 *强调*、简历里的链接与 <br>）。
 * 这些统一在服务端渲染好再吐给前端，前端的公开页面就完全不需要打包 Markdown 解析器。
 * 后台编辑时走的是另一条路：直接读原始文档，改的还是源码。
 */

export function renderHomeDoc(d: HomeDocData) {
  const side = (s: HomeDocData['pro']) => ({
    ...s,
    ledeHtml: renderInline(s.lede),
    nowHtml: renderInline(s.now),
  })
  return { pro: side(d.pro), personal: side(d.personal) }
}

export function renderAboutDoc(d: AboutDocData) {
  return {
    ...d,
    bodyHtml: renderMarkdown(d.body),
    nowHtml: renderMarkdown(d.now),
    contacts: d.contacts.map((c) => ({ ...c, vHtml: renderInline(c.v) })),
  }
}

export function renderCvDoc(d: CvDocData) {
  return {
    ...d,
    sections: d.sections.map((s) => ({
      ...s,
      rows: s.rows.map((r) => ({ ...r, vHtml: renderInline(r.v) })),
    })),
  }
}
