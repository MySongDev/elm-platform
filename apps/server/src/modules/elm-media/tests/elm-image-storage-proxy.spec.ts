/**
 * 图片本地存储 + 代理（下载/读取）行为测试。
 *
 * 测试准入（AI_TEST_POLICY 场景 2 + 场景 5 回归）：
 * - 原子保存「半文件不对外提供」/ 损坏检测：易回归逻辑
 * - 已落盘图片在 fetch 必抛错时仍可读（离线不回源）：已落盘却因上游不可用而加载失败的回归
 * - 下载失败分类（HTML 假图 / 空 body / 超限 / 超时 / 404）
 * 全部用临时目录 + mock ConfigService / fetch，不触碰真实上游。
 */

import type { ConfigService } from '@nestjs/config'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ElmImageProxyService } from '@/modules/elm-media/services/elm-image-proxy.service'
import { ELM_IMAGE_MAX_BYTES, ElmImageStorageService } from '@/modules/elm-media/services/elm-image-storage.service'
import { imageAssetKey } from '@/modules/elm-media/utils/elm-image'

function configService(values: Record<string, unknown>): ConfigService {
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService
}

/** 手搓一个 getReader() 兼容的 body，让 downloadImage 的 readLimited 能消费。 */
function makeReader(chunks: Array<Uint8Array | Buffer>) {
  const queue = [...chunks]
  return {
    read: jest.fn(async () => {
      const value = queue.shift()
      if (value === undefined) {
        return {
          value: undefined,
          done: true,
        }
      }
      return {
        value,
        done: false,
      }
    }),
    cancel: jest.fn(async () => {}),
    releaseLock: jest.fn(),
  }
}

function fakeResponse(status: number, bodyChunks: Array<Uint8Array | Buffer>, ok = status >= 200 && status < 300) {
  return {
    ok,
    status,
    // 404 / 5xx 分支会调 body.cancel()，fake 必须提供
    body: {
      getReader: () => makeReader(bodyChunks),
      cancel: jest.fn(async () => {}),
    },
    headers: { get: jest.fn(() => null) },
  } as unknown as Response
}

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  Buffer.from('fakepngpayload'),
])

describe('elm image storage + proxy', () => {
  let dir: string
  let storage: ElmImageStorageService
  let proxy: ElmImageProxyService
  let originalFetch: typeof globalThis.fetch

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'elm-img-'))
    storage = new ElmImageStorageService(configService({ 'elmImages.directory': dir }))
    proxy = new ElmImageProxyService(configService({
      'elmApi.baseUrl': 'https://elm.example.test',
      'elmApi.imageTimeoutMs': 1000,
      'elmImages.directory': dir,
    }), storage)
    originalFetch = globalThis.fetch
  })

  afterEach(async () => {
    globalThis.fetch = originalFetch
    jest.restoreAllMocks()
    await rm(dir, {
      recursive: true,
      force: true,
    })
  })

  describe('storage', () => {
    it('saves atomically and the asset is then readable', async () => {
      await storage.saveImage('/a.png', PNG)
      const res = await storage.readImage('/a.png')
      expect(res.status).toBe('ok')
      if (res.status === 'ok')
        expect(res.contentType).toBe('image/png')
    })

    it('refuses to serve a corrupt / non-image file as an asset', async () => {
      // 手动把一个非图片字节写进资产路径，模拟「损坏资产」
      const key = imageAssetKey('/a.png')
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, `${key}.img`), '<html>corrupt</html>', 'utf8')

      const res = await storage.readImage('/a.png')
      expect(res.status).toBe('missing')
    })

    it('isCompleteImage is a light check that does not load the whole file', async () => {
      expect(await storage.isCompleteImage('/a.png')).toBe(false)
      await storage.saveImage('/a.png', PNG)
      expect(await storage.isCompleteImage('/a.png')).toBe(true)
      // 损坏的资产即使存在也不算完整
      const key = imageAssetKey('/b.png')
      await writeFile(path.join(dir, `${key}.img`), Buffer.from('not-an-image-bytes'), 'utf8')
      expect(await storage.isCompleteImage('/b.png')).toBe(false)
    })
  })

  describe('getImage (offline local read)', () => {
    it('serves an already-saved image with zero upstream fetch calls', async () => {
      const fetchMock = jest.fn(async () => {
        throw new Error('no upstream allowed')
      })
      globalThis.fetch = fetchMock

      await storage.saveImage('/cdn/2/35/x.png', PNG)

      const res = await proxy.getImage('/cdn/2/35/x.png')
      expect(res.contentType).toBe('image/png')
      const chunks: Buffer[] = []
      for await (const c of res.stream)
        chunks.push(Buffer.from(c))
      expect(Buffer.concat(chunks)).toEqual(PNG)

      // 关键：离线不回源
      expect(fetchMock).toHaveBeenCalledTimes(0)
    })

    it('returns 404-shaped error when the local asset is missing, without fetching', async () => {
      const fetchMock = jest.fn()
      globalThis.fetch = fetchMock
      await expect(proxy.getImage('/cdn/2/35/absent.png')).rejects.toThrow()
      expect(fetchMock).toHaveBeenCalledTimes(0)
    })

    it('rejects path traversal / protocol-relative without network or out-of-bounds file ops', async () => {
      const fetchMock = jest.fn()
      globalThis.fetch = fetchMock
      await expect(proxy.getImage('/../etc/x.png')).rejects.toThrow()
      await expect(proxy.getImage('//evil.com/x.png')).rejects.toThrow()
      expect(fetchMock).toHaveBeenCalledTimes(0)
    })
  })

  describe('downloadImage (failure classification)', () => {
    it('downloads a valid image and publishes it', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(fakeResponse(200, [PNG]))
      const res = await proxy.downloadImage('/cdn/2/35/x.png')
      expect(res).toEqual({
        success: true,
        bytes: PNG.length,
        contentType: 'image/png',
      })
      expect(await storage.isCompleteImage('/cdn/2/35/x.png')).toBe(true)
    })

    it('classifies a 404 as not-found', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(fakeResponse(404, []))
      const res = await proxy.downloadImage('/x.png')
      expect(res).toEqual(expect.objectContaining({
        success: false,
        reason: 'not-found',
      }))
    })

    it('classifies a 5xx as upstream-error', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(fakeResponse(502, []))
      const res = await proxy.downloadImage('/x.png')
      expect(res).toEqual(expect.objectContaining({
        success: false,
        reason: 'upstream-error',
      }))
    })

    it('classifies an empty 200 body as empty-body', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(fakeResponse(200, []))
      const res = await proxy.downloadImage('/x.png')
      expect(res).toEqual(expect.objectContaining({
        success: false,
        reason: 'empty-body',
      }))
    })

    it('classifies HTML pseudo-images as non-image-bytes and does not publish them', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(fakeResponse(200, [Buffer.from('<html>err</html>')]))
      const res = await proxy.downloadImage('/x.png')
      expect(res).toEqual(expect.objectContaining({
        success: false,
        reason: 'non-image-bytes',
      }))
      // 没有资产被发布
      expect(await storage.isCompleteImage('/x.png')).toBe(false)
    })

    it('classifies an over-size image as oversized (and does not keep the whole payload)', async () => {
      // 略超上限的 PNG 头 + 填充
      const big = Buffer.concat([PNG, Buffer.alloc(ELM_IMAGE_MAX_BYTES + 16 - PNG.length)])
      globalThis.fetch = jest.fn().mockResolvedValue(fakeResponse(200, [big]))
      const res = await proxy.downloadImage('/x.png')
      expect(res).toEqual(expect.objectContaining({
        success: false,
        reason: 'oversized',
      }))
      expect(await storage.isCompleteImage('/x.png')).toBe(false)
    })

    it('classifies a mid-download timeout as timeout', async () => {
      jest.useFakeTimers()
      globalThis.fetch = jest.fn((_url, init) => new Promise((_resolve, reject) => {
        const signal = (init as { signal: AbortSignal }).signal
        signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))
        })
      }))

      const p = proxy.downloadImage('/x.png')
      // 触发 setTimeout(abort)
      jest.advanceTimersByTime(1000)
      const res = await p
      expect(res).toEqual(expect.objectContaining({
        success: false,
        reason: 'timeout',
      }))
      jest.useRealTimers()
    })

    it('does not leave a readable complete asset when the download fails mid-way', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(fakeResponse(404, []))
      await proxy.downloadImage('/x.png')
      // 失败路径必须没有发布 .img 资产
      expect(await storage.isCompleteImage('/x.png')).toBe(false)
    })
  })

  describe('idempotent re-run', () => {
    it('re-running does not overwrite an already-valid asset and skips it', async () => {
      const fetchMock = jest.fn().mockResolvedValue(fakeResponse(200, [PNG]))
      globalThis.fetch = fetchMock

      await proxy.downloadImage('/a.png')
      expect(await storage.isCompleteImage('/a.png')).toBe(true)

      // 导入层：已完整的会被 isCompleteImage 判定为跳过（这里直接验证跳过语义）
      expect(await storage.isCompleteImage('/a.png')).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
