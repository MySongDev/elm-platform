export default [
  {
    url: '/v1/pois',
    method: 'get',
    response: () => {
      // 根据路径和参数返回数据
      return {
        code: 200,
        data: [
          {
            name: '上海迪士尼乐园',
            address: '上海市浦东新区申迪西路753号',
            latitude: 31.14419,
            longitude: 121.66034,
            geohash: '31.14419,121.66034',
          },
          {
            name: '迪士尼',
            address: '上海市浦东新区妙境路1118号家乐福川沙店1层',
            latitude: 31.18183,
            longitude: 121.69279,
            geohash: '31.18183,121.69279',
          },
          {
            name: '迪士尼小镇',
            address: '上海市浦东新区申迪西路255弄',
            latitude: 31.1435,
            longitude: 121.6601,
            geohash: '31.1435,121.6601',
          },
          {
            name: '迪士尼世界商店',
            address: '上海市浦东新区迪士尼小镇内',
            latitude: 31.1438,
            longitude: 121.6592,
            geohash: '31.1438,121.6592',
          },
          {
            name: '迪士尼乐园酒店',
            address: '上海市浦东新区申迪西路360号',
            latitude: 31.1416,
            longitude: 121.6578,
            geohash: '31.1416,121.6578',
          },
          {
            name: '迪士尼地铁站',
            address: '上海市浦东新区川沙镇迪士尼度假区',
            latitude: 31.1433,
            longitude: 121.6608,
            geohash: '31.1433,121.6608',
          },
          {
            name: '迪士尼购物村',
            address: '上海市浦东新区申迪东路88号',
            latitude: 31.1405,
            longitude: 121.6652,
            geohash: '31.1405,121.6652',
          },
          {
            name: '迪士尼星愿公园',
            address: '上海市浦东新区申迪西路255弄',
            latitude: 31.1421,
            longitude: 121.6625,
            geohash: '31.1421,121.6625',
          },
          {
            name: '迪士尼大剧院',
            address: '上海市浦东新区迪士尼小镇',
            latitude: 31.1443,
            longitude: 121.6589,
            geohash: '31.1443,121.6589',
          },
          {
            name: '迪士尼停车场',
            address: '上海市浦东新区申迪西路',
            latitude: 31.1428,
            longitude: 121.6637,
            geohash: '31.1428,121.6637',
          },
        ],
      }
    },
  },
]
