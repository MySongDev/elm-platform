import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmCityService } from '../services/elm-city.service'

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

  @Get('v2/pois')
  @ApiOperation({ summary: '根据经纬度详细定位（query）' })
  getPoiByQuery(@Query('geohash') geohash?: string) {
    return rawResponse(this.cityService.getPoi(geohash))
  }

  @Get('v2/pois/:geohash')
  @ApiOperation({ summary: '根据经纬度详细定位（param）' })
  getPoiByParam(@Param('geohash') geohash: string) {
    return rawResponse(this.cityService.getPoi(geohash))
  }

  @Get('restapi/bgs/poi/reverse_geo_coding')
  @ApiOperation({ summary: '逆地理编码兼容接口' })
  reverseGeoCoding(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    return rawResponse(this.cityService.getPoi(undefined, Number(latitude), Number(longitude)))
  }

  @Get('v2/index_entry')
  @ApiOperation({ summary: '食品分类列表' })
  getIndexEntry() {
    return rawResponse(this.cityService.getIndexEntries())
  }
}
