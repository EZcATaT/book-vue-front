import { computed, reactive } from 'vue'

const STORAGE_KEY = 'book_borrow_session'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saved = loadSession()

export const authState = reactive({
  token: saved?.token || '',
  user: saved?.user || null
})

export const isAdmin = computed(() => authState.user?.role === 'admin')

export function setSession(token, user) {
  authState.token = token
  authState.user = user
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
}

export function clearSession() {
  authState.token = ''
  authState.user = null
  localStorage.removeItem(STORAGE_KEY)
}
