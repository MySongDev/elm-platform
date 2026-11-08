import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../../common/interceptors/transform.interceptor'
import { ElmCityService } from '../../services/elm-city.service'

@ApiTags('Elm 兼容接口 - 城市定位')
@Controller()
export class ElmLocationController {
  constructor(private readonly cityService: ElmCityService) {}

  @Get('v1/cities')
  @ApiOperation({ summary: '获取城市列表' })
  getCities(@Query('type') type = 'guess') {
    return rawResponse(this.cityService.getCities(type))
  }

  @Get('v1/cities/:id')
  @ApiOperation({ summary: '获取城市信息' })
  getCity(@Param('id', ParseIntPipe) id: number) {
    return rawResponse(this.cityService.getCity(id))
  }

  @Get('v1/pois')
  @ApiOperation({ summary: '搜索地址' })
  searchPois(
    @Query('city_id', ParseIntPipe) cityId: number,
    @Query('keyword') keyword = '',
  ) {
    return rawResponse(this.cityService.searchPois(cityId, keyword))
  }

  // 定位反查唯一入口：坐标 → 地址/城市（逆地理编码）。
  // 入参 geohash("lat,lng") 与 latitude/longitude 等价，由 ElmCityService.getPoi
  // → parseGeoHash 归一化，无需拆成多个路由。
  // ⚠️ 路径刻意不用 elm 上游形状（原 v2/pois）：v2 是上游的版本号，与
  // docs/api/versioning.md 里「/api/v2/* = 我们自己的新版本号」语义撞车。本接口按功能命名。
  @Get('geo/reverse-geocode')
  @ApiOperation({ summary: '逆地理编码：坐标反查地址与城市' })
  @ApiQuery({
    name: 'geohash',
    required: false,
    type: String,
    example: '31.22967,121.4762',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    type: Number,
    example: 31.22967,
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    type: Number,
    example: 121.4762,
  })
  getPoi(
    @Query('geohash') geohash?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    return rawResponse(this.cityService.getPoi(geohash, Number(latitude), Number(longitude)))
  }

  // 2026-09-30 本地化：原本转发上游，现读 `category_entries` 表（16 条，由 elm:import 导入）。
  @Get('v2/index_entry')
  @ApiOperation({ summary: '食品分类列表' })
  async getIndexEntry() {
    return rawResponse(await this.cityService.listCategoryEntries())
  }
}
