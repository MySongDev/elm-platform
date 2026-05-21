/**
 * 商家规格配置
 * 不同商家类型、不同商品规格对应不同的UI展示配置
 */

/**
 * 蛋糕店规格配置
 */
export const CAKE_SPECS_CONFIG = {
  // 6英寸蛋糕规格
  '6inch': {
    id: '6inch',
    label: '6英寸',
    price: 68,
    originalPrice: 88,
    servings: '1-2人食',
    specs: [
      {
        id: 'flavor_group_1',
        name: '口味搭配',
        type: 'single',
        required: true,
        options: [
          { id: 'durian_mango_glutinous', name: '榴莲+芒果+血糯米', price: 0 },
          { id: 'durian_seaweed_taro', name: '榴莲+海苔肉松+芋泥', price: 0 },
          { id: 'mango_glutinous_coconut', name: '芒果+血糯米+椰奶冻', price: 0 },
          { id: 'dragon_fruit_mango_glutinous', name: '火龙果+芒果+血糯米', price: 0 },
        ],
      },
      {
        id: 'size_option',
        name: '尺寸',
        type: 'single',
        required: true,
        options: [
          { id: '6inch', name: '6英寸', price: 0 },
          { id: '8inch', name: '8英寸', price: +30 },
        ],
      },
    ],
    // UI展示配置
    ui: {
      layout: 'card', // 卡片布局
      showOriginalPrice: true, // 显示原价
      showDiscount: true, // 显示折扣
      showServings: true, // 显示份量
      themeColor: '#FF6B6B', // 主题色
      imagePosition: 'left', // 图片位置
    },
  },

  // 4英寸小份规格
  '4inch': {
    id: '4inch',
    label: '4英寸',
    price: 49.8,
    originalPrice: null,
    servings: '1人食',
    specs: [
      {
        id: 'topping_1',
        name: '小料1',
        type: 'single',
        required: true,
        options: [
          { id: 'durian_3a', name: '3A金枕榴莲', price: 0 },
          { id: 'mango', name: '芒果', price: 0 },
          { id: 'glutinous_rice', name: '手工血糯米', price: 0 },
          { id: 'mochi', name: '麻薯', price: 0 },
        ],
      },
      {
        id: 'topping_2',
        name: '小料2',
        type: 'single',
        required: false,
        options: [
          { id: 'red_bean', name: '红豆', price: 0 },
          { id: 'earl_grey_pudding', name: '伯爵红茶奶冻', price: 0 },
          { id: 'popping', name: '脆啵啵', price: 0 },
          { id: 'chocolate_cubes', name: '法芙娜巧克力豆', price: 0 },
        ],
      },
      {
        id: 'topping_3',
        name: '小料3',
        type: 'single',
        required: false,
        options: [
          { id: 'oreo', name: '奥利奥', price: 0 },
          { id: 'hazelnut', name: '榛子巧克力', price: 0 },
          { id: 'coconut_pudding', name: '椰奶冻', price: 0 },
          { id: 'strawberry_pudding', name: '草莓奶冻', price: 0 },
        ],
      },
    ],
    ui: {
      layout: 'list', // 列表布局
      showOriginalPrice: false,
      showDiscount: false,
      showServings: true,
      themeColor: '#FFD93D',
      imagePosition: 'top',
      columns: 2, // 两列布局
    },
  },
}

/**
 * 鲜花店规格配置
 */
export const FLOWER_SPECS_CONFIG = {
  single_bouquet: {
    id: 'single_bouquet',
    label: '单品花束',
    price: 266,
    originalPrice: 283.67,
    specs: [
      {
        id: 'flower_type',
        name: '花材选择',
        type: 'single',
        required: true,
        options: [
          { id: 'pink_rose_99', name: '99支粉玫瑰', price: 0 },
          { id: 'carnation_20', name: '20支康乃馨', price: 0 },
        ],
      },
    ],
    ui: {
      layout: 'card',
      showOriginalPrice: true,
      showDiscount: true,
      showBadge: true, // 显示标签
      badgeText: '母亲节',
      themeColor: '#E91E63',
      imagePosition: 'top',
    },
  },
}

/**
 * 获取规格配置
 */
export function getSpecsConfig(specsType, merchantType = 'cake') {
  const configMap = {
    cake: CAKE_SPECS_CONFIG,
    flower: FLOWER_SPECS_CONFIG,
  }

  return configMap[merchantType]?.[specsType] || null
}

/**
 * 获取所有规格选项
 */
export function getAllSpecsOptions(specsConfig) {
  if (!specsConfig?.specs)
    return []
  return specsConfig.specs.flatMap(spec => spec.options)
}
