import { nextTick, ref } from 'vue'

export function useFlyCartAnimation(options) {
  const {
    addToCart,
    cartSelector = '.cart-icon-box',
    duration = 600,
  } = options

  const flyBalls = ref([])
  let ballId = 0

  function triggerFlyBall(startRect) {
    if (!startRect)
      return

    const cartEl = document.querySelector(cartSelector)
    if (!cartEl)
      return

    const endRect = cartEl.getBoundingClientRect()
    const startX = startRect.left + startRect.width / 2
    const startY = startRect.top + startRect.height / 2
    const endX = endRect.left + endRect.width / 2
    const endY = endRect.top + endRect.height / 2
    const id = ++ballId

    flyBalls.value.push({
      id,
      startX,
      startY,
      endX,
      endY,
      flying: false,
    })

    nextTick(() => {
      requestAnimationFrame(() => {
        const idx = flyBalls.value.findIndex(ball => ball.id === id)
        if (idx !== -1)
          flyBalls.value[idx].flying = true
      })
    })

    setTimeout(() => {
      flyBalls.value = flyBalls.value.filter(ball => ball.id !== id)
    }, duration)
  }

  async function handleAdd(food, specIndex, rect) {
    addToCart(food, specIndex)
    await nextTick()
    triggerFlyBall(rect)
  }

  return {
    flyBalls,
    handleAdd,
    triggerFlyBall,
  }
}
