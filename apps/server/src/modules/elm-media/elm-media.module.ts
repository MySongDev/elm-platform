import { Module } from '@nestjs/common'
import { ElmImageImportService } from './services/elm-image-import.service'
import { ElmImageProxyService } from './services/elm-image-proxy.service'
import { ElmImageStorageService } from './services/elm-image-storage.service'

/**
 * Elm 图片资产：本地读取契约、稳定资产存储、显式下载与导入编排。
 *
 * 与 `modules/storage/local-disk.storage.ts` 不是同一契约：
 * 后者面向用户上传（随机 UUID 文件名），本模块按契约路径 hash 建稳定键，
 * 并包含图片完整性检查与原子发布（016 §3.1）。
 */
@Module({
  providers: [ElmImageStorageService, ElmImageProxyService, ElmImageImportService],
  exports: [ElmImageStorageService, ElmImageProxyService, ElmImageImportService],
})
export class ElmMediaModule {}
