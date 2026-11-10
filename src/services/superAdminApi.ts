
import axios from 'axios'

const superAdminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

superAdminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('superAdminAccessToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default superAdminApi
