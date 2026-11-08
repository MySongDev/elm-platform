import type { Request, Response } from 'express'
import { Controller, Get, Req, Res, StreamableFile } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../../common/interceptors/transform.interceptor'
import { ElmImageProxyService } from '../../services/elm-image-proxy.service'

/**
 * 图片端点。
 *
 * ★ `GET /api/img/*` 是**长期契约**（迁移方案议题 2 决策 2）：
 * 这个对外 URL 形状一旦上线不再改。内部实现已从「转发上游」演进到「读自己的本地资产」，
 * 前端零改动（011 §6.1）。
 *
 * 本地化后：正常图片请求只读本地文件（ElmImageProxyService.getImage），不发起任何上游网络调用。
 * 上游只在导入命令显式下载（downloadImage）时被访问；本地缺失 → 404，不回源、不重定向。
 *
 * 为什么必须自己中转而不是 302 重定向（历史背景）：
 * 重定向目标 elm.cangdu.org 不在小程序合法域名白名单 → 必须自己出字节。
 *
 * ⚠️ 通配而非 `:filename`：图片路径含子目录，image_path 形如 `shop/15c1513a00615.jpg`。
 *
 * ⚠️ `/cdn/` 子命名空间（首页轮播图）：`/api/img/cdn/X` → 本地键含 `/cdn/` 前缀，
 * 与默认源同名尾路径互不串图（见 utils/elm-image.ts resolveContractPath）。
 */
@ApiTags('Elm 兼容接口 - 图片（本地读取）')
@Controller()
export class ElmImageProxyController {
  constructor(private readonly imageProxy: ElmImageProxyService) {}

  @Get('img/*')
  @ApiOperation({ summary: '本地读取图片（长期契约，小程序端唯一图片来源；正常请求不访问上游）' })
  async proxyImage(
    @Req() req: Request,
    // passthrough: 可以设响应头，但仍由 Nest 处理返回的 StreamableFile 走流式响应。
    // ⚠️ 不用 @Header() 装饰器：它在 handler 执行前就写入响应头，
    // 异常路径（404/502）同样会命中 → 一张图临时 404 会被 immutable 强缓存一年。
    @Res({ passthrough: true }) res: Response,
  ) {
    // Express 4 的通配路由把匹配部分放进 params[0]，不含前导斜杠
    const wildcard = (req.params as Record<string, string>)[0] ?? ''
    const path = `/${wildcard.replace(/^\/+/, '')}` as `/${string}`

    const { stream, contentType } = await this.imageProxy.getImage(path)

    // 只在成功路径设强缓存：让小程序端自己缓存一年。这是三层缓存模型里效果最大的一层
    // （同一用户第二次看同一张图完全不请求后端），也是「纯转发不留副本」够用的根本原因。
    // ⚠️ immutable 成立的前提是同 URL 即同内容 —— 上游用内容 hash 命名
    // （如 164ad0b6a3917599.jpg），符合 immutable 语义。
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    // 上游可能带 no-transform 之外的指令，这里明确允许小程序端按 Content-Type 渲染
    res.setHeader('Content-Type', contentType)

    // rawResponse 让全局 TransformInterceptor 跳过 JSON 信封包装，
    // 把 StreamableFile 原样交给 Nest（与其他 elm controller 同一约定）。
    return rawResponse(new StreamableFile(stream))
  }
}
