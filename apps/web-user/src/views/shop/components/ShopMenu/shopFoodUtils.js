/**
 * 商家菜单展示用纯函数：价格、规格、活动样式、购物车数量等
 */

export function getFoodPrice(food) {
  const spec = food?.specfoods?.[0]
  return spec?.price ?? 0
}

export function getFoodOriginalPrice(food) {
  const spec = food?.specfoods?.[0]
  return spec?.original_price ?? 0
}

export function hasFoodSpecs(food) {
  return Array.isArray(food?.specifications) && food.specifications.length > 0
}

export function getFoodActivityBoxStyle(food) {
  const color = food?.activity?.icon_color
  if (!color)
    return {}
  return {
    background: `#${color}26`,
    color: `#${color}`,
  }
}

export function getFoodActivityTextStyle(food) {
  const c = food?.activity?.image_text_color
  if (!c)
    return {}
  return { color: `#${c}` }
}

export function getFoodTipsLine(food) {
  if (food?.tips)
    return food.tips
  return `月售${food.month_sales ?? 0} · 好评${food.satisfy_rate ?? 0}%`
}

export function getCartQty(cartMap, food) {
  if (!cartMap || !food?.item_id)
    return 0

  if (cartMap.get(food.item_id))
    return cartMap.get(food.item_id).qty || 0

  let quantity = 0
  cartMap.forEach((item, key) => {
    if (String(key).startsWith(`${food.item_id}-`))
      quantity += item.qty || 0
  })

  return quantity
}
