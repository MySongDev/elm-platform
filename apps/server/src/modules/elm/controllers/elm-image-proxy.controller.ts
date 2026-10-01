import type { Request, Response } from 'express'
import { Controller, Get, Req, Res, StreamableFile } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmImageProxyService } from '../services/elm-image-proxy.service'

/**
 * 图片代理端点。
 *
 * ★ `GET /api/img/*` 是**长期契约**（迁移方案议题 2 决策 2）：
 * 这个对外 URL 形状一旦上线不再改。将来内部实现从「转发上游」演进到
 * 「读自己的存储」时，前端零改动。
 *
 * 为什么必须自己中转而不是 302 重定向：
 * 重定向目标 elm.cangdu.org 仍不在小程序合法域名白名单内，能否放行不确定 →
 * 必须真正中转字节流（议题 2 / 阻塞项 B）。
 *
 * ⚠️ 通配而非 `:filename`：上游路径含子目录，
 * seed 数据里的 image_path 形如 `shop/15c1513a00615.jpg`（真实上游数据多为裸文件名）。
 *
 * ⚠️ 对外前缀 `/api/img/` 与上游前缀 `/img/` 是**两回事**：
 * Express 通配只捕获 `img/` 之后的部分，必须由 service 补回上游前缀，
 * 否则 `/api/img/a.jpg` 会被解析成上游 `/a.jpg`（404）。
 */
@ApiTags('Elm 兼容接口 - 图片代理')
@Controller()
export class ElmImageProxyController {
  constructor(private readonly imageProxy: ElmImageProxyService) {}

  @Get('img/*')
  @ApiOperation({ summary: '代理上游图片（长期契约，小程序端唯一图片来源）' })
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
