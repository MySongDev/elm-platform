import { BadGatewayException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

function appendQuery(url: URL, query: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value]
    for (const item of values.filter(item => item !== null && item !== undefined))
      url.searchParams.append(key, String(item))
  }
}

@Injectable()
export class ElmUpstreamService {
  private readonly logger = new Logger(ElmUpstreamService.name)
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('elmApi.baseUrl')
      ?? 'https://elm.cangdu.org'
    ).replace(/\/+$/, '')
    this.timeoutMs
      = this.configService.get<number>('elmApi.timeoutMs') ?? 8000
  }

  async get<T = unknown>(
    path: `/${string}`,
    query: Record<string, unknown> = {},
  ): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined

    try {
      if (path.startsWith('//'))
        throw new Error('Elm upstream path must not be protocol-relative')

      const baseUrl = new URL(this.baseUrl)
      if (!['http:', 'https:'].includes(baseUrl.protocol))
        throw new Error('Elm upstream base URL must use HTTP or HTTPS')
      if (baseUrl.search || baseUrl.hash)
        throw new Error('Elm upstream base URL must not contain query or fragment')

      baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`
      const url = new URL(path.slice(1), baseUrl)
      if (url.origin !== baseUrl.origin)
        throw new Error('Elm upstream URL changed origin')

      appendQuery(url, query)

      const controller = new AbortController()
      timeout = setTimeout(() => controller.abort(), this.timeoutMs)
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        redirect: 'error',
        signal: controller.signal,
      })

      if (!response.ok) {
        await response.body?.cancel()
        throw new Error(`Elm upstream responded with status ${response.status}`)
      }

      return await response.json() as T
    }
    catch (error) {
      this.logger.error(
        `Elm upstream request failed for ${path}`,
        error instanceof Error ? error.stack : String(error),
      )
      throw new BadGatewayException(
        `Elm upstream request failed for ${path}`,
      )
    }
    finally {
      if (timeout !== undefined)
        clearTimeout(timeout)
    }
  }
}
