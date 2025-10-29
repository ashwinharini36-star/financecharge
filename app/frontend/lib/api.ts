import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('organizations')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API functions
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

export const customersApi = {
  list: (params?: any) => api.get('/customers', { params }),
  create: (data: any) => api.post('/customers', data),
  get: (id: string) => api.get(`/customers/${id}`),
}

export const productsApi = {
  list: () => api.get('/products'),
}

export const quotesApi = {
  list: (params?: any) => api.get('/quotes', { params }),
  create: (data: any) => api.post('/quotes', data),
  get: (id: string) => api.get(`/quotes/${id}`),
  approve: (id: string) => api.post(`/quotes/${id}/approve`),
  convertToInvoice: (id: string) => api.post(`/quotes/${id}/convert-to-invoice`),
}

export const invoicesApi = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  send: (id: string) => api.post(`/invoices/${id}/send`),
}

export const dashboardApi = {
  cashPulse: () => api.get('/dashboard/cash-pulse'),
}

export const paymentsApi = {
  webhook: (provider: string, data: any) => 
    api.post(`/payments/webhook/${provider}`, data),
}
