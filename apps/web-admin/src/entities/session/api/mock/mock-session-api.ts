import type { SessionApi } from '../contracts'
import {
  createDevMockLoginResult,
  createDevMockUserInfo,
  DEV_MOCK_TIMESTAMP,
  getDevMockUserMenus,
} from './fixtures'

let currentUser = createDevMockUserInfo()

export const mockSessionApi: SessionApi = {
  async login(credentials) {
    const result = createDevMockLoginResult(credentials.account, credentials.rememberMe)
    currentUser = { ...result.user }
    return result
  },
  async getCurrentUser() {
    return { ...currentUser }
  },
  async getUserMenus() {
    return getDevMockUserMenus()
  },
  async updateProfile(data) {
    currentUser = {
      ...currentUser,
      ...data,
      updatedAt: DEV_MOCK_TIMESTAMP,
    }
    return { ...currentUser }
  },
  async getSecurityLogs(params) {
    return {
      list: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    }
  },
}
