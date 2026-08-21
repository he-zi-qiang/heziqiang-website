import fs from 'node:fs/promises'
import { readDoc } from './docs.js'

/**
 * 生产模式下伺服前端的 index.html 时，把「站点信息」里的标题与描述写进去。
 *
 * 单页应用的标题本来是路由切换时用 JS 补的，爬虫和首屏拿到的是打包时那份固定文案。
 * 这里在发出去之前替换一次，后台改完站名或描述，源码里那份也跟着变。
 */
let cached: string | null = null

/** 站点信息被改写后调用，下一次请求会重新生成 */
export function resetIndexHtml() {
  cached = null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function getIndexHtml(filePath: string): Promise<string> {
  if (cached) return cached

  const raw = await fs.readFile(filePath, 'utf8')
  const site = await readDoc('site')
  if (!site) {
    cached = raw
    return raw
  }

  const title = escapeHtml(`${site.siteName} · ${site.siteNameEn}`.trim())
  const description = escapeHtml(site.description)

  cached = raw
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${description}" />`,
    )
  return cached
}
