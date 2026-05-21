
# 创建完整的Mock Server代码文件

mock_server_code = '''
/**
 * Mock Server for 饿了么商铺API
 * 完整实现URL路由匹配和动态数据响应
 * 
 * 启动方式: node mock-server.js
 * 测试地址: http://localhost:3000/shopping/restaurants?latitude=31.22967&longitude=121.4762
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// ==========================================
// 1. Mock数据生成器
// ==========================================
const MockDataGenerator = {
  categories: [
    "快餐便当/简餐", "小吃/夜宵", "甜点/饮品", "超市/生鲜", 
    "蔬菜水果", "送药上门", "汉堡/披萨", "日韩料理", "中式炒菜"
  ],
  
  supportTypes: [
    {"description": "已加入“外卖保”计划，食品安全有保障", "icon_color": "999999", "icon_name": "保", "id": 7, "name": "外卖保"},
    {"description": "准时必达，超时秒赔", "icon_color": "57A9FF", "icon_name": "准", "id": 9, "name": "准时达"},
    {"description": "该商家支持开发票，请在下单时填写好发票抬头", "icon_color": "999999", "icon_name": "票", "id": 4, "name": "开发票"},
    {"description": "使用优惠券可享更多优惠", "icon_color": "FF6B6B", "icon_name": "券", "id": 1, "name": "优惠券"},
    {"description": "新用户首单立减", "icon_color": "4ECDC4", "icon_name": "新", "id": 2, "name": "新用户"}
  ],
  
  deliveryModes: [
    {"color": "57A9FF", "id": 1, "is_solid": true, "text": "蜂鸟专送"},
    {"color": "FF6B6B", "id": 2, "is_solid": false, "text": "商家自送"},
    {"color": "4ECDC4", "id": 3, "is_solid": true, "text": "同城速送"}
  ],
  
  shopNames: [
    "肯德基", "麦当劳", "必胜客", "星巴克", "海底捞", "喜茶", "奈雪的茶",
    "瑞幸咖啡", "汉堡王", "真功夫", "永和大王", "西贝莜面村", "外婆家",
    "绿茶餐厅", "呷哺呷哺", "蜜雪冰城", "茶百道", "古茗", "一点点", "CoCo都可",
    "正新鸡排", "绝味鸭脖", "周黑鸭", "良品铺子", "三只松鼠", "来伊份",
    "盒马鲜生", "叮咚买菜", "每日优鲜", "永辉超市", "沃尔玛", "家乐福"
  ],
  
  addresses: [
    "上海市浦东新区陆家嘴环路1000号", "上海市黄浦区南京东路步行街", 
    "上海市徐汇区淮海中路999号", "上海市静安区南京西路1266号",
    "上海市长宁区虹桥路1号", "上海市普陀区中山北路3300号",
    "上海市虹口区四川北路888号", "上海市杨浦区五角场万达广场",
    "上海市闵行区莘庄地铁站", "上海市宝山区淞宝路155弄"
  ],
  
  // 生成随机商铺数据
  generateRestaurants(count = 50) {
    const restaurants = [];
    const baseLat = 31.2304; // 上海中心纬度
    const baseLng = 121.4737; // 上海中心经度
    
    for (let i = 0; i < count; i++) {
      const latOffset = (Math.random() - 0.5) * 0.8;
      const lngOffset = (Math.random() - 0.5) * 0.8;
      const lat = parseFloat((baseLat + latOffset).toFixed(5));
      const lng = parseFloat((baseLng + lngOffset).toFixed(5));
      
      // 随机支持服务
      const supports = this.shuffleArray([...this.supportTypes])
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map((s, idx) => ({...s, _id: `591bec73c2bbc84a6328a1e${idx}`}));
      
      // 随机配送方式
      const deliveryMode = this.deliveryModes[Math.floor(Math.random() * this.deliveryModes.length)];
      
      // 随机活动
      const activities = this.generateActivities(Math.floor(Math.random() * 3) + 1);
      
      const restaurant = {
        name: this.shopNames[Math.floor(Math.random() * this.shopNames.length)] + 
              (Math.random() > 0.7 ? `(${i+1}号店)` : ""),
        address: this.addresses[Math.floor(Math.random() * this.addresses.length)],
        id: i + 1,
        latitude: lat,
        longitude: lng,
        location: [lng, lat],
        phone: `1${Math.floor(Math.random() * 70 + 30)}${Math.floor(Math.random() * 90000000 + 10000000)}`,
        category: this.categories[Math.floor(Math.random() * this.categories.length)],
        supports: supports,
        status: Math.random() > 0.2 ? 0 : 1, // 80%营业中
        recent_order_num: Math.floor(Math.random() * 4950 + 50),
        rating_count: Math.floor(Math.random() * 1900 + 100),
        rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        promotion_info: Math.random() > 0.6 ? ["", "新店开业大酬宾", "周年庆特惠", "会员专享优惠"][Math.floor(Math.random() * 4)] : "",
        piecewise_agent_fee: {
          tips: `配送费约¥${[0, 3, 5, 6, 8, 10][Math.floor(Math.random() * 6)]}`
        },
        opening_hours: [`${Math.floor(Math.random() * 4 + 6)}:00/${Math.floor(Math.random() * 5 + 20)}:00`],
        license: { catering_service_license_image: "", business_license_image: "" },
        is_new: Math.random() > 0.8,
        is_premium: Math.random() > 0.7,
        image_path: `/img/shop/${Math.floor(Math.random() * 900000 + 100000)}a${Math.floor(Math.random() * 90000 + 10000)}.jpg`,
        identification: {
          registered_number: "", registered_address: "", operation_period: "",
          licenses_scope: "", licenses_number: "", licenses_date: "",
          legal_person: "", identificate_date: null, identificate_agency: "", company_name: ""
        },
        float_minimum_order_amount: [0, 15, 20, 30, 50][Math.floor(Math.random() * 5)],
        float_delivery_fee: [0, 3, 5, 6, 8, 10][Math.floor(Math.random() * 6)],
        distance: `${(Math.random() * 19.5 + 0.5).toFixed(1)}公里`,
        order_lead_time: `${Math.floor(Math.random() * 40 + 20)}分钟`,
        description: ["", "好吃的", "新鲜美味", "品质保证", "快速送达"][Math.floor(Math.random() * 5)],
        delivery_mode: deliveryMode,
        activities: activities,
        restaurant_category_id: Math.floor(Math.random() * 9) + 1
      };
      
      restaurants.push(restaurant);
    }
    
    return restaurants;
  },
  
  // 生成活动数据
  generateActivities(count) {
    const activityTypes = [
      {"icon_name": "减", "name": "满减优惠", "icon_color": "f07373"},
      {"icon_name": "特", "name": "优惠大酬宾", "icon_color": "EDC123"},
      {"icon_name": "折", "name": "折扣商品", "icon_color": "FF6B6B"},
      {"icon_name": "赠", "name": "满赠活动", "icon_color": "4ECDC4"},
      {"icon_name": "新", "name": "新客专享", "icon_color": "45B7D1"}
    ];
    
    const descriptions = ["满30减5，满60减8", "满50减10，满100减25", "全场8折起", "买一送一", "第二杯半价", "新用户立减15元"];
    
    return activityTypes.slice(0, count).map((act, idx) => ({
      ...act,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      id: Math.floor(Math.random() * 100) + 1,
      _id: `591bec73c2bbc84a6328a1f${Math.floor(Math.random() * 99) + 1}`
    }));
  },
  
  // 数组随机排序
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
};

// 初始化数据
const allRestaurants = MockDataGenerator.generateRestaurants(100);

// ==========================================
// 2. 请求参数解析工具
// ==========================================
const QueryParser = {
  // 解析查询参数
  parse(req) {
    const query = req.query;
    return {
      latitude: parseFloat(query.latitude) || 31.2304,
      longitude: parseFloat(query.longitude) || 121.4737,
      offset: parseInt(query.offset) || 0,
      limit: parseInt(query.limit) || 20,
      restaurant_category_id: query.restaurant_category_id ? parseInt(query.restaurant_category_id) : null,
      order_by: parseInt(query.order_by) || 4, // 默认智能排序
      delivery_mode: query.delivery_mode,
      support_ids: query.support_ids,
      restaurant_category_ids: query.restaurant_category_ids
    };
  }
};

// ==========================================
// 3. 数据筛选与排序引擎
// ==========================================
const DataEngine = {
  // 计算两点间距离（简化版，实际应用使用Haversine公式）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },
  
  // 筛选数据
  filter(data, params) {
    let result = [...data];
    
    // 按分类筛选
    if (params.restaurant_category_id) {
      result = result.filter(r => r.restaurant_category_id === params.restaurant_category_id);
    }
    
    // 按配送方式筛选
    if (params.delivery_mode) {
      const modeIds = Array.isArray(params.delivery_mode) ? params.delivery_mode : [params.delivery_mode];
      result = result.filter(r => modeIds.includes(String(r.delivery_mode.id)));
    }
    
    // 按支持服务筛选
    if (params.support_ids) {
      const supportIds = Array.isArray(params.support_ids) ? params.support_ids : [params.support_ids];
      result = result.filter(r => 
        r.supports.some(s => supportIds.includes(String(s.id)))
      );
    }
    
    return result;
  },
  
  // 排序数据
  sort(data, orderBy, userLat, userLng) {
    const sorted = [...data];
    
    switch(orderBy) {
      case 1: // 起送价最低
        return sorted.sort((a, b) => a.float_minimum_order_amount - b.float_minimum_order_amount);
        
      case 2: // 配送速度最快
        return sorted.sort((a, b) => {
          const timeA = parseInt(a.order_lead_time);
          const timeB = parseInt(b.order_lead_time);
          return timeA - timeB;
        });
        
      case 3: // 评分最高
        return sorted.sort((a, b) => b.rating - a.rating);
        
      case 4: // 智能排序（综合评分+销量）
        return sorted.sort((a, b) => {
          const scoreA = (a.rating * 0.6) + (Math.min(a.recent_order_num / 1000, 5) * 0.4);
          const scoreB = (b.rating * 0.6) + (Math.min(b.recent_order_num / 1000, 5) * 0.4);
          return scoreB - scoreA;
        });
        
      case 5: // 距离最近
        return sorted.sort((a, b) => {
          const distA = this.calculateDistance(userLat, userLng, a.latitude, a.longitude);
          const distB = this.calculateDistance(userLat, userLng, b.latitude, b.longitude);
          return distA - distB;
        });
        
      case 6: // 销量最高
        return sorted.sort((a, b) => b.recent_order_num - a.recent_order_num);
        
      default:
        return sorted;
    }
  },
  
  // 分页处理
  paginate(data, offset, limit) {
    return data.slice(offset, offset + limit);
  }
};

// ==========================================
// 4. 路由匹配与处理
// ==========================================

/**
 * GET /shopping/restaurants
 * 获取商铺列表 - 完全匹配API文档
 */
app.get('/shopping/restaurants', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /shopping/restaurants`, req.query);
  
  // 参数校验
  if (!req.query.latitude || !req.query.longitude) {
    return res.status(400).json({
      error: "缺少必要参数",
      message: "latitude 和 longitude 为必填参数"
    });
  }
  
  // 解析参数
  const params = QueryParser.parse(req);
  
  // 筛选数据
  let result = DataEngine.filter(allRestaurants, params);
  
  // 排序数据
  result = DataEngine.sort(result, params.order_by, params.latitude, params.longitude);
  
  // 分页
  result = DataEngine.paginate(result, params.offset, params.limit);
  
  // 添加距离计算（基于用户位置）
  result = result.map(r => ({
    ...r,
    distance: `${DataEngine.calculateDistance(params.latitude, params.longitude, r.latitude, r.longitude).toFixed(1)}公里`,
    order_lead_time: `${Math.floor(Math.random() * 30 + 20)}分钟`
  }));
  
  // 模拟网络延迟
  setTimeout(() => {
    res.json(result);
  }, 200 + Math.random() * 300);
});

/**
 * GET /shopping/restaurant/:id
 * 获取单个商铺详情
 */
app.get('/shopping/restaurant/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const restaurant = allRestaurants.find(r => r.id === id);
  
  if (!restaurant) {
    return res.status(404).json({ error: "商铺不存在" });
  }
  
  res.json(restaurant);
});

/**
 * GET /shopping/categories
 * 获取商铺分类列表
 */
app.get('/shopping/categories', (req, res) => {
  const categories = [
    { id: 1, name: "快餐便当", icon: "🍱", count: 156 },
    { id: 2, name: "小吃/夜宵", icon: "🍢", count: 89 },
    { id: 3, name: "甜点/饮品", icon: "🧋", count: 234 },
    { id: 4, name: "超市/生鲜", icon: "🥬", count: 67 },
    { id: 5, name: "蔬菜水果", icon: "🍎", count: 45 },
    { id: 6, name: "送药上门", icon: "💊", count: 23 },
    { id: 7, name: "汉堡/披萨", icon: "🍔", count: 78 },
    { id: 8, name: "日韩料理", icon: "🍣", count: 56 },
    { id: 9, name: "中式炒菜", icon: "🥘", count: 123 }
  ];
  
  res.json(categories);
});

/**
 * GET /shopping/delivery_modes
 * 获取配送方式列表
 */
app.get('/shopping/delivery_modes', (req, res) => {
  res.json([
    { id: 1, text: "蜂鸟专送", color: "57A9FF", description: "平台专送，更快更准时" },
    { id: 2, text: "商家自送", color: "FF6B6B", description: "商家自行配送" },
    { id: 3, text: "同城速送", color: "4ECDC4", description: "同城快递配送" }
  ]);
});

/**
 * GET /shopping/supports
 * 获取商家支持服务列表
 */
app.get('/shopping/supports', (req, res) => {
  res.json([
    { id: 7, name: "外卖保", icon_name: "保", icon_color: "999999", description: "食品安全有保障" },
    { id: 9, name: "准时达", icon_name: "准", icon_color: "57A9FF", description: "准时必达，超时秒赔" },
    { id: 4, name: "开发票", icon_name: "票", icon_color: "999999", description: "支持开发票" },
    { id: 1, name: "优惠券", icon_name: "券", icon_color: "FF6B6B", description: "支持使用优惠券" },
    { id: 2, name: "新用户", icon_name: "新", icon_color: "4ECDC4", description: "新用户优惠" }
  ]);
});

// ==========================================
// 5. 错误处理与中间件
// ==========================================

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `未找到路由: ${req.method} ${req.path}`,
    available_routes: [
      "GET /shopping/restaurants",
      "GET /shopping/restaurant/:id", 
      "GET /shopping/categories",
      "GET /shopping/delivery_modes",
      "GET /shopping/supports"
    ]
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

// ==========================================
// 6. 启动服务器
// ==========================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          饿了么商铺API Mock Server 已启动              ║
╠════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                     ║
║  API端点:                                               ║
║    • GET /shopping/restaurants                        ║
║    • GET /shopping/restaurant/:id                     ║
║    • GET /shopping/categories                         ║
║    • GET /shopping/delivery_modes                     ║
║    • GET /shopping/supports                           ║
╠════════════════════════════════════════════════════════╣
║  测试链接:                                              ║
║  http://localhost:${PORT}/shopping/restaurants?latitude=31.22967&longitude=121.4762
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
'''

# 保存为文件
with open('/mnt/kimi/output/mock-server.js', 'w', encoding='utf-8') as f:
    f.write(mock_server_code)

print("✅ Mock Server文件已生成: /mnt/kimi/output/mock-server.js")
print("\n文件大小:", len(mock_server_code), "字符")
