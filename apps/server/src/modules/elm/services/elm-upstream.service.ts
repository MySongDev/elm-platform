import { BadGatewayException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { resolveUpstreamUrl } from '../utils/upstream-url'

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
      const url = resolveUpstreamUrl(this.baseUrl, path)

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
