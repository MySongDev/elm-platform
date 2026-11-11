import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { API_BASE_URL, getUploadUrl } from '@/config'
import { CanceledError, send, TransportError } from '@/platform/request'
import { setAlertHandler } from '@/services/http/policies/error-message'
import { uploadUserAvatar } from './api-user'

vi.mock('@/services/http/loading', () => ({
  startGlobalLoading: vi.fn(),
  finishGlobalLoading: vi.fn(),
}))
vi.mock('@/platform/location', () => ({
  getLocationWithTimeout: vi.fn(),
}))

const alert = vi.fn()
const avatar = 'avatars/profile.png'
const envelope = JSON.stringify({
  code: 200,
  data: { avatar },
  message: 'success',
})

beforeEach(() => {
  vi.clearAllMocks()
  const storage = new Map([
    ['customer_token', 'old-token'],
    ['customer_refresh_token', 'refresh-token'],
  ])
  vi.stubGlobal('uni', {
    getStorageSync: key => storage.get(key) || '',
    setStorageSync: (key, value) => storage.set(key, value),
    uploadFile: vi.fn(),
    request: vi.fn(),
  })
  setAlertHandler(alert)
})

afterEach(() => {
  setAlertHandler(null)
  vi.unstubAllGlobals()
})

// 已知缺陷回归：错误路由和相对 URL 会让小程序上传不发请求，HTTP 401 也曾被当成成功吞掉。
describe('头像上传与展示契约', () => {
  it('上传使用绝对 customer-avatar 地址、file 字段和 token，返回持久头像路径', async () => {
    uni.uploadFile.mockImplementation((options) => {
      options.success({
        statusCode: 201,
        data: envelope,
      })
      return { abort: vi.fn() }
    })

    await expect(uploadUserAvatar('wxfile://avatar.png')).resolves.toBe(avatar)
    expect(uni.uploadFile).toHaveBeenCalledWith(expect.objectContaining({
      url: `${API_BASE_URL.replace(/\/+$/, '')}/customer-avatar`,
      filePath: 'wxfile://avatar.png',
      name: 'file',
      header: { Authorization: 'Bearer old-token' },
    }))
    expect(uni.request).not.toHaveBeenCalled()
    expect(alert).not.toHaveBeenCalled()
    expect(getUploadUrl(avatar)).toBe(`${API_BASE_URL.replace(/\/+$/, '')}/uploads/${avatar}`)
    expect(getUploadUrl(null)).toBe('')
  })

  it('401 刷新后重发同一文件，不改成普通 JSON 请求', async () => {
    uni.uploadFile
      .mockImplementationOnce((options) => {
        options.success({
          statusCode: 401,
          data: JSON.stringify({ message: 'Unauthorized' }),
        })
        return { abort: vi.fn() }
      })
      .mockImplementationOnce((options) => {
        options.success({
          statusCode: 201,
          data: envelope,
        })
        return { abort: vi.fn() }
      })
    uni.request.mockImplementation((options) => {
      options.success({
        statusCode: 201,
        data: {
          code: 200,
          data: { accessToken: 'new-token' },
        },
      })
      return { abort: vi.fn() }
    })

    await expect(uploadUserAvatar('wxfile://avatar.png')).resolves.toBe(avatar)
    expect(uni.uploadFile).toHaveBeenCalledTimes(2)
    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: `${API_BASE_URL.replace(/\/+$/, '')}/customer-auth/refresh`,
      method: 'POST',
      data: { refreshToken: 'refresh-token' },
    }))
    expect(uni.uploadFile.mock.calls[1][0]).toEqual(expect.objectContaining({
      filePath: 'wxfile://avatar.png',
      header: { Authorization: 'Bearer new-token' },
    }))
    expect(alert).not.toHaveBeenCalled()
  })

  it('http 400 不能伪装成上传成功', async () => {
    uni.uploadFile.mockImplementation((options) => {
      options.success({
        statusCode: 400,
        data: JSON.stringify({ message: '图片大小不能超过 2MB' }),
      })
      return { abort: vi.fn() }
    })
    await expect(uploadUserAvatar('wxfile://avatar.png')).rejects.toMatchObject({
      status: 400,
      data: { message: '图片大小不能超过 2MB' },
    })
    expect(uni.request).not.toHaveBeenCalled()
  })

  it('非 JSON 响应会结束等待并报错，不挂住上传状态', async () => {
    uni.uploadFile.mockImplementation((options) => {
      options.success({
        statusCode: 201,
        data: '<html>bad gateway</html>',
      })
      return { abort: vi.fn() }
    })
    await expect(send({
      url: '/customer-avatar',
      upload: {
        filePath: 'wxfile://avatar.png',
        name: 'file',
      },
    }).promise).rejects.toBeInstanceOf(TransportError)
  })

  it('网络失败和超时保留统一错误标记', async () => {
    uni.uploadFile.mockImplementation((options) => {
      options.fail({ errMsg: 'uploadFile:fail timeout' })
      return { abort: vi.fn() }
    })
    await expect(send({
      url: '/customer-avatar',
      upload: {
        filePath: 'wxfile://avatar.png',
        name: 'file',
      },
    }).promise).rejects.toMatchObject({
      isTimeout: true,
      isNetworkError: false,
    })
  })

  it('取消上传调用 UploadTask.abort，晚到的成功响应不能回写', async () => {
    const abort = vi.fn()
    uni.uploadFile.mockReturnValue({ abort })
    const handle = send({
      url: '/customer-avatar',
      upload: {
        filePath: 'wxfile://avatar.png',
        name: 'file',
      },
    })
    handle.abort()
    uni.uploadFile.mock.calls[0][0].success({
      statusCode: 201,
      data: envelope,
    })
    await expect(handle.promise).rejects.toBeInstanceOf(CanceledError)
    expect(abort).toHaveBeenCalledOnce()
  })

  it('成功信封缺少头像地址时，不把临时路径当作已保存头像', async () => {
    uni.uploadFile.mockImplementation((options) => {
      options.success({
        statusCode: 201,
        data: JSON.stringify({
          code: 200,
          data: {},
        }),
      })
      return { abort: vi.fn() }
    })
    await expect(uploadUserAvatar('wxfile://avatar.png')).resolves.toBe('')
  })
})
