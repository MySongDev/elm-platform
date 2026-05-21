// server.js
// const jsonServer = require('json-server')
import jsonServer from 'json-server'

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

// 设置端口
const PORT = 3000

server.use(middlewares)
server.use(jsonServer.bodyParser)

// 自定义路由中间件 - 处理 /v1/users/:user_id/addresses 格式
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)

  // 匹配 GET /v1/users/:user_id/addresses
  const getMatch = req.url.match(/\/v1\/users\/(\d+)\/addresses$/)
  if (getMatch && req.method === 'GET') {
    const userId = getMatch[1]
    req.url = `/addresses?user_id=${userId}`
    console.log(`→ 重写到: ${req.url}`)
  }

  // 匹配 POST /v1/users/:user_id/addresses
  const postMatch = req.url.match(/\/v1\/users\/(\d+)\/addresses$/)
  if (postMatch && req.method === 'POST') {
    const userId = postMatch[1]
    // 在 body 中添加 user_id
    req.body.user_id = Number.parseInt(userId)
    req.url = '/addresses'
    console.log(`→ 重写到: ${req.url} 并添加 user_id=${userId}`)
  }

  // 匹配 DELETE /v1/users/:user_id/addresses/:address_id
  const deleteMatch = req.url.match(/\/v1\/users\/(\d+)\/addresses\/(\d+)$/)
  if (deleteMatch && req.method === 'DELETE') {
    const addressId = deleteMatch[2]
    req.url = `/addresses/${addressId}`
    console.log(`→ 重写到: ${req.url}`)
  }

  next()
})

// 自定义响应格式
router.render = (req, res) => {
  // GET 请求返回数组
  if (req.method === 'GET' && req.originalUrl?.includes('/addresses?')) {
    res.json(res.locals.data)
  }
  // POST 请求返回自定义格式
  else if (req.method === 'POST' && req.originalUrl?.includes('/addresses')) {
    res.json({
      status: 1,
      success: '添加地址成功',
    })
  }
  // DELETE 请求返回自定义格式
  else if (req.method === 'DELETE') {
    res.json({
      status: 1,
      success: '删除地址成功',
    })
  }
  // 其他情况
  else {
    res.json(res.locals.data)
  }
}

server.use(router)

server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`)
  console.log('\n可用接口:')
  console.log(`  GET    http://localhost:${PORT}/v1/users/1/addresses`)
  console.log(`  POST   http://localhost:${PORT}/v1/users/1/addresses`)
  console.log(`  DELETE http://localhost:${PORT}/v1/users/1/addresses/297740202`)
})
