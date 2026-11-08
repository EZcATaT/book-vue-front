<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import { authState, clearSession } from '@/utils/auth'
import { notify } from '@/utils/toast'
import { currentDateText, initialOf } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

const isAdmin = computed(() => authState.user?.role === 'admin')
const roleLabel = computed(() => (isAdmin.value ? '管理员' : '普通用户'))
const pageTitle = computed(() => {
  if (route.path === '/books') return isAdmin.value ? '图书管理' : '图书借阅'
  if (route.path === '/borrows') return isAdmin.value ? '借阅管理' : '我的借阅'
  return route.meta.title || '工作台'
})
const avatar = computed(() => initialOf(authState.user?.name || authState.user?.username))

const navItems = computed(() => {
  const items = [
    { path: '/dashboard', glyph: '台', label: '工作台' },
    { path: '/books', glyph: '书', label: isAdmin.value ? '图书管理' : '图书借阅' },
    { path: '/borrows', glyph: '借', label: '借阅记录' }
  ]
  if (isAdmin.value) {
    items.push({ path: '/users', glyph: '人', label: '用户管理' })
  }
  return items
})

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  }
)

watchEffect(() => {
  document.title = `${pageTitle.value} - 图书管理系统`
})

function logout() {
  // 先清除本地登录状态并跳转，保证点击后立刻有反馈；
  // 通知后端令牌失效的请求放在后台异步执行，后端没响应也不影响退出
  clearSession()
  notify('已退出登录', 'info')
  router.replace('/login')
  authApi.logout().catch(() => {
    // 后端令牌失效失败不影响本地退出
  })
}
</script>

<template>
  <div class="app-shell">
    <div v-if="mobileOpen" class="sidebar-overlay" @click="mobileOpen = false"></div>

    <aside class="sidebar" :class="{ 'is-open': mobileOpen }">
      <div class="brand">
        <div class="brand-mark">书</div>
        <div class="brand-copy">
          <strong>图书管理系统</strong>
          <span>借阅管理平台</span>
        </div>
      </div>

      <div class="nav-caption">导航菜单</div>
      <nav class="nav-list">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="is-active"
        >
          <span class="nav-glyph">{{ item.glyph }}</span>
          <span class="nav-text">{{ item.label }}</span>
          <span class="nav-dot"></span>
        </router-link>
      </nav>

      <div class="sidebar-tip">
        <div class="tip-title">今日提示</div>
        <p>读一本好书，就是和许多高尚的人谈话。</p>
      </div>

      <div class="sidebar-user">
        <div class="avatar">{{ avatar }}</div>
        <div class="user-copy">
          <strong>{{ authState.user?.name || authState.user?.username }}</strong>
          <span>{{ roleLabel }} · {{ authState.user?.username }}</span>
        </div>
        <button class="logout-btn" title="退出登录" @click="logout">退出</button>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <button class="menu-btn" aria-label="打开菜单" @click="mobileOpen = true">
          <span></span><span></span><span></span>
        </button>
        <div class="topbar-title">
          <span>图书借阅管理系统</span>
          <strong>{{ pageTitle }}</strong>
        </div>
        <div class="topbar-meta">
          <span class="today">{{ currentDateText() }}</span>
          <span class="role-chip" :class="{ admin: isAdmin }">{{ roleLabel }}</span>
          <button class="logout-btn" @click="logout">退出登录</button>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>
