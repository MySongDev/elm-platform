export async function fetchAndPaginate(fetcher, pageSize = 8) {
  try {
    const list = await fetcher()
    const result = []

    for (let i = 0; i < list.length; i += pageSize)
      result.push(list.slice(i, i + pageSize))

    return result
  }
  catch (err) {
    console.error('请求或分页出错:', err)
    return []
  }
}
