import { Module } from '@nestjs/common'
import { ElmCityService } from './services/elm-city.service'

/**
 * 定位与城市：内存城市数据 + 外部逆地理编码（失败保留模拟回退）。
 * 定位不是商业目录，见 016 §3.1。
 */
@Module({
  providers: [ElmCityService],
  exports: [ElmCityService],
})
export class ElmLocationModule {}
