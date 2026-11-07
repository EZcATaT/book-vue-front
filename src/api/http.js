import axios from 'axios'
import { authState, clearSession } from '@/utils/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api',
  timeout: 12000
})

http.interceptors.request.use((config) => {
  if (authState.token) {
    config.headers.Authorization = `Bearer ${authState.token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (!payload || typeof payload.code === 'undefined') {
      return payload
    }
    if (payload.code !== 200) {
      const message = payload.msg || '操作失败'
      if (message.includes('登录已过期')) {
        clearSession()
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1'
        }
      }
      return Promise.reject(new Error(message))
    }
    return payload.data
  },
  (error) => {
    let message = '网络请求失败，请检查后端是否启动'
    if (error.response?.data?.msg) {
      message = error.response.data.msg
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试'
    }
    return Promise.reject(new Error(message))
  }
)

export default http
