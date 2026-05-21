interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: string
}

interface ApiError {
  code: number
  message: string
  timestamp: string
  path: string
}
