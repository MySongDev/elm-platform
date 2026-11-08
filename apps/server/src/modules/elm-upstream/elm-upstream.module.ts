import { Module } from '@nestjs/common'
import { ElmUpstreamImportService } from './services/elm-upstream-import.service'
import { ElmUpstreamService } from './services/elm-upstream.service'

/**
 * 上游（elm.cangdu.org）访问与一次性导入。
 *
 * 导入器同时服务两条路径：CLI 预导（elm:import）与菜单懒加载兜底
 * （ElmFoodService.ensureMenuSynced）。因此它是业务依赖，不是仅 CLI 使用的工具（016 §3.1）。
 */
@Module({
  providers: [ElmUpstreamService, ElmUpstreamImportService],
  exports: [ElmUpstreamService, ElmUpstreamImportService],
})
export class ElmUpstreamModule {}
