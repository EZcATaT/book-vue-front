import { createRouter, createWebHistory } from 'vue-router'
import { authState } from '@/utils/auth'
import AppLayout from '@/components/AppLayout.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true, title: '登录' }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true, title: '注册' }
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true, title: '工作台' }
      },
      {
        path: 'books',
        name: 'books',
        component: () => import('@/views/BooksView.vue'),
        meta: { requiresAuth: true, title: '图书管理' }
      },
      {
        path: 'borrows',
        name: 'borrows',
        component: () => import('@/views/BorrowsView.vue'),
        meta: { requiresAuth: true, title: '借阅记录' }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true, title: '用户管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const loggedIn = Boolean(authState.token && authState.user)

  if (to.meta.requiresAuth && !loggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && loggedIn) {
    return { name: 'dashboard' }
  }
  if (to.meta.requiresAdmin && authState.user?.role !== 'admin') {
    return { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '图书借阅'} · 墨卷`
})

export default router
