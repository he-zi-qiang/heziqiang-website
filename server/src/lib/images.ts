import fs from 'node:fs/promises'
import sharp from 'sharp'

/** 长边上限：照片页两栏、正文版心都在 600px 上下，2 倍屏也够用 */
const MAX_EDGE = 1600
const WEBP_QUALITY = 82

/** 这些格式会被重新编码；GIF 可能是动图，原样保留 */
const COMPRESSIBLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

// 上传是偶发操作，不值得让 libvips 常驻缓存吃掉 2G 小服务器的内存
sharp.cache(false)

export interface SavedImage {
  path: string
  size: number
  originalSize: number
  mimetype: string
}

/**
 * 把刚上传的原图转成长边不超过 1600px 的 WebP，就地替换。
 * 先按 EXIF 摆正方向，再丢掉全部元数据——顺带抹掉手机照片里的拍摄位置。
 * 转出来反而更大（原图本来就小）或者解码失败时，原样保留原图。
 */
export async function compressImage(filePath: string, mimetype: string): Promise<SavedImage> {
  const originalSize = (await fs.stat(filePath)).size
  const original: SavedImage = { path: filePath, size: originalSize, originalSize, mimetype }
  if (!COMPRESSIBLE.has(mimetype)) return original

  const tmp = `${filePath}.tmp`
  const target = filePath.replace(/\.[^./]+$/, '') + '.webp'
  try {
    const info = await sharp(filePath)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(tmp)

    if (info.size >= originalSize) {
      await fs.rm(tmp, { force: true })
      return original
    }
    await fs.rename(tmp, target)
    if (target !== filePath) await fs.rm(filePath, { force: true })
    return { path: target, size: info.size, originalSize, mimetype: 'image/webp' }
  } catch {
    await fs.rm(tmp, { force: true })
    return original
  }
}
