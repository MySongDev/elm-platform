import { Module } from '@nestjs/common'
import { ElmCatalogModule } from '../elm-catalog/elm-catalog.module'
import { ElmLegacyModule } from '../elm-legacy/elm-legacy.module'
import { ElmLocationModule } from '../elm-location/elm-location.module'
import { ElmMediaModule } from '../elm-media/elm-media.module'
import { ElmUpstreamModule } from '../elm-upstream/elm-upstream.module'

/**
 * 组合根：只做 imports/exports，不再注册任何 Service。
 * 各 *-api.module.ts 仍只导入 ElmModule，避免一次性改动 5 个接口模块。
 * 后续如需按端收窄依赖，改为直接导入具体子模块即可。
 */
@Module({
  imports: [ElmMediaModule, ElmUpstreamModule, ElmCatalogModule, ElmLocationModule, ElmLegacyModule],
  exports: [ElmMediaModule, ElmUpstreamModule, ElmCatalogModule, ElmLocationModule, ElmLegacyModule],
})
export class ElmModule {}
