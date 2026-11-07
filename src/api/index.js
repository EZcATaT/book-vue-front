import http from './http'

export const authApi = {
  login: (data) => http.post('/auth/login', data),
  register: (data) => http.post('/auth/register', data),
  logout: () => http.post('/auth/logout')
}

export const userApi = {
  list: () => http.get('/users'),
  get: (id) => http.get(`/users/${id}`),
  create: (data) => http.post('/users', data),
  update: (id, data) => http.put(`/users/${id}`, data),
  remove: (id) => http.delete(`/users/${id}`)
}

export const bookApi = {
  list: () => http.get('/books'),
  get: (id) => http.get(`/books/${id}`),
  create: (data) => http.post('/books', data),
  update: (id, data) => http.put(`/books/${id}`, data),
  remove: (id) => http.delete(`/books/${id}`)
}

export const borrowApi = {
  list: () => http.get('/borrows'),
  byUser: (userId) => http.get(`/users/${userId}/borrows`),
  get: (id) => http.get(`/borrows/${id}`),
  create: (data) => http.post('/borrows', data),
  returnBook: (id) => http.put(`/borrows/${id}`, {}),
  remove: (id) => http.delete(`/borrows/${id}`)
}
