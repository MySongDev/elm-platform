export function isBusinessError(data) {
  if (!data || typeof data !== 'object')
    return false

  if (data.code !== undefined) {
    if (typeof data.code === 'number') {
      return data.code !== 0 && data.code !== 200
    }

    const looksLikeBusinessCode = data.message !== undefined || data.msg !== undefined

    return looksLikeBusinessCode
  }

  if (data.success !== undefined) {
    return data.success === false
  }

  if (data.status !== undefined) {
    const looksLikeResponseEnvelope = data.message !== undefined || data.msg !== undefined || data.type !== undefined

    return looksLikeResponseEnvelope
      && data.status !== 1
      && data.status !== 200
      && data.status !== true
  }

  return false
}

export function getBusinessMessage(data) {
  return data?.message || data?.msg || '业务处理失败'
}
