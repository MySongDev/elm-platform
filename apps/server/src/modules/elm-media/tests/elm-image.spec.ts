/**
 * 图片路径 / MIME / 盘点工具（utils/elm-image.ts）的纯函数测试。
 *
 * 测试准入（AI_TEST_POLICY 场景 1 独立工具函数）：
 * 路径校验（穿越 / 反斜杠 / 协议相对 / 未知 origin）、命名空间隔离、
 * 图片字节识别，都是脱离 UI 和外部服务可验证的逻辑。
 */

import {
  detectImageMime,
  ElmImagePathError,
  imageAssetKey,
  looksLikeImageRef,
  normalizeImageTail,
  resolveContractPath,
  resolveDbImageRef,
  sniffImageMime,
} from '@/modules/elm-media/utils/elm-image'

describe('elm image utils', () => {
  describe('normalizeImageTail', () => {
    it('normalizes leading slashes and keeps legal subdirectories', () => {
      expect(normalizeImageTail('/shop/15c1513a00615.jpg')).toBe('/shop/15c1513a00615.jpg')
      expect(normalizeImageTail('shop/15c1513a00615.jpg')).toBe('/shop/15c1513a00615.jpg')
      expect(normalizeImageTail('/a/b.jpg')).toBe('/a/b.jpg')
      // 无点后缀的 hash 图片（上游确有其形态）
      expect(normalizeImageTail('0e07558e305abfb2618ae760142222f9png')).toBe('/0e07558e305abfb2618ae760142222f9png')
    })

    it.each([
      ['empty', ''],
      ['whitespace-only', '   '],
      ['protocol-relative', '//evil.com/x.jpg'],
      ['double leading slash (conservative reject)', '///a/b.jpg'],
      ['backslash escape', 'a\\b.jpg'],
      ['traversal segment', '/a/../../etc/passwd'],
      ['dot segment', '/a/./b.jpg'],
      ['query string', '/a.jpg?x=1'],
      ['fragment', '/a.jpg#top'],
    ])('rejects %s (%s)', (_label, input) => {
      expect(() => normalizeImageTail(input)).toThrow(ElmImagePathError)
    })

    it('rejects control characters including NUL', () => {
      expect(() => normalizeImageTail('/a\x00b.jpg')).toThrow(ElmImagePathError)
      expect(() => normalizeImageTail('/a\u001Fb.jpg')).toThrow(ElmImagePathError)
    })
  })

  describe('resolveContractPath', () => {
    it('routes /cdn/ to the CDN namespace with no /img prefix', () => {
      const r = resolveContractPath('/cdn/2/35/xxx')
      expect(r.namespace).toBe('cdn')
      expect(r.isCdn).toBe(true)
      expect(r.upstreamPath).toBe('/2/35/xxx')
      expect(r.contractPath).toBe('/cdn/2/35/xxx')
    })

    it('routes default namespace with the /img prefix restored', () => {
      const r = resolveContractPath('/187bcca1ec6114376.jpg')
      expect(r.namespace).toBe('default')
      expect(r.upstreamPath).toBe('/img/187bcca1ec6114376.jpg')
      expect(r.contractPath).toBe('/187bcca1ec6114376.jpg')
    })

    it('does not let default and CDN assets with the same tail collide', () => {
      const a = imageAssetKey(resolveContractPath('/a.jpg').contractPath)
      const b = imageAssetKey(resolveContractPath('/cdn/a.jpg').contractPath)
      expect(a).not.toBe(b)
    })

    it('rejects path traversal so no out-of-bounds file operation is possible', () => {
      expect(() => resolveContractPath('/../secrets/x.jpg')).toThrow(ElmImagePathError)
      expect(() => resolveContractPath('/cdn/../etc/x.jpg')).toThrow(ElmImagePathError)
    })

    it('rejects protocol-relative and unknown-origin shaped inputs', () => {
      expect(() => resolveContractPath('//evil.com/x.jpg')).toThrow(ElmImagePathError)
      expect(() => resolveContractPath('/a\\b.jpg')).toThrow(ElmImagePathError)
    })
  })

  describe('resolveDbImageRef', () => {
    it('accepts known absolute URLs and maps them to the right namespace', () => {
      const cdn = resolveDbImageRef('https://fuss10.elemecdn.com/2/35/xxx', 'cdn')
      expect(cdn).toEqual({
        ok: true,
        contractPath: '/cdn/2/35/xxx',
        namespace: 'cdn',
      })

      const def = resolveDbImageRef('https://elm.cangdu.org/img/shop/1.jpg', 'default')
      expect(def).toEqual({
        ok: true,
        contractPath: '/shop/1.jpg',
        namespace: 'default',
      })
    })

    it('records unknown external origins as invalid references and does not download', () => {
      const r = resolveDbImageRef('https://example.com/x.jpg', 'default')
      expect(r.ok).toBe(false)
      if (!r.ok)
        expect(r.reason).toBe('unknown-origin')
    })

    it('treats empty values as a distinct empty reference, not a download failure', () => {
      expect(resolveDbImageRef('', 'default').ok).toBe(false)
      expect((resolveDbImageRef('', 'default') as { reason: string }).reason).toBe('empty')
      expect((resolveDbImageRef(null, 'default') as { reason: string }).reason).toBe('empty')
      expect((resolveDbImageRef('   ', 'default') as { reason: string }).reason).toBe('empty')
    })

    it('normalizes relative paths by the expected namespace', () => {
      expect(resolveDbImageRef('shop/1.jpg', 'default')).toEqual({
        ok: true,
        contractPath: '/shop/1.jpg',
        namespace: 'default',
      })
      expect(resolveDbImageRef('/2/35/xxx', 'cdn')).toEqual({
        ok: true,
        contractPath: '/cdn/2/35/xxx',
        namespace: 'cdn',
      })
    })
  })

  describe('looksLikeImageRef (identification JSON filter)', () => {
    it('lets clear image values through', () => {
      expect(looksLikeImageRef('https://elm.cangdu.org/img/x.jpg')).toBe(true)
      expect(looksLikeImageRef('/img/x.png')).toBe(true)
      expect(looksLikeImageRef('x.webp')).toBe(true)
      // 上游 hash + 无点格式名形态
      expect(looksLikeImageRef('0e07558e305abfb2618ae760142222f9png')).toBe(true)
    })

    it('rejects non-image text so it is not treated as a path', () => {
      expect(looksLikeImageRef('1234567890')).toBe(false)
      expect(looksLikeImageRef('湖南省岳阳楼区')).toBe(false)
      expect(looksLikeImageRef('营业执照号9100000')).toBe(false)
      expect(looksLikeImageRef('')).toBe(false)
    })
  })

  describe('mIME sniffing', () => {
    it.each([
      ['jpeg', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), 'image/jpeg'],
      ['png', Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), Buffer.alloc(4)]), 'image/png'],
      ['webp', Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]), 'image/webp'],
      ['gif', Buffer.from('GIF89a', 'ascii'), 'image/gif'],
    ])('detects %s from magic bytes', (_label, bytes, mime) => {
      expect(sniffImageMime(bytes)).toBe(mime)
      expect(detectImageMime(Buffer.concat([bytes, Buffer.alloc(64)]))).toBe(mime)
    })

    it('rejects HTML pseudo-images and empty bodies', () => {
      expect(detectImageMime(Buffer.from('<html><body>error</body></html>', 'ascii'))).toBeNull()
      expect(detectImageMime(Buffer.alloc(0))).toBeNull()
    })

    it('does not falsely reject when only fewer than 12 bytes are available yet', () => {
      // 3 字节 JPEG 头可判；但前 3 字节的 PNG 还不够签名，必须返回 null 而非误判为「非图」
      expect(sniffImageMime(Buffer.from([0xFF, 0xD8, 0xFF]))).toBe('image/jpeg')
      expect(sniffImageMime(Buffer.from([0x89, 0x50, 0x4E]))).toBeNull()
    })
  })
})
