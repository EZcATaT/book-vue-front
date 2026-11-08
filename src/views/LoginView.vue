<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api'
import { setSession } from '@/utils/auth'
import { notify } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const form = reactive({
  username: String(route.query.username || ''),
  password: ''
})
const loading = ref(false)
const errorMessage = ref('')
const notice = ref('')

onMounted(() => {
  if (route.query.registered) {
    notice.value = '注册成功，请使用新账号登录。'
  }
  if (route.query.expired) {
    notice.value = '登录状态已过期，请重新登录。'
  }
})

function fillDemo(type) {
  if (type === 'admin') {
    form.username = 'admin'
    form.password = '123456'
  } else {
    form.username = 'reader'
    form.password = '123456'
  }
  errorMessage.value = ''
}

async function submit() {
  errorMessage.value = ''
  if (!form.username.trim() || !form.password) {
    errorMessage.value = '请输入账号和密码'
    return
  }
  loading.value = true
  try {
    const data = await authApi.login({
      username: form.username.trim(),
      password: form.password
    })
    setSession(data.token, data.user)
    notify(`欢迎回来，${data.user.name}`, 'success')
    const redirect = String(route.query.redirect || '')
    router.replace(redirect.startsWith('/') ? redirect : '/dashboard')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-mobile-brand">
          <div class="brand-mark">书</div>
          <strong>图书借阅管理系统</strong>
        </div>

        <div class="auth-heading">
          <h2>用户登录</h2>
          <p>请输入账号和密码</p>
        </div>

        <div v-if="notice" class="form-notice">{{ notice }}</div>
        <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>

        <form class="auth-form" @submit.prevent="submit">
          <label class="field">
            <span>登录账号</span>
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              autocomplete="username"
              maxlength="50"
            />
          </label>

          <label class="field">
            <span>登录密码</span>
            <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              maxlength="100"
            />
          </label>

          <button class="btn btn-primary btn-block auth-submit" :disabled="loading">
            {{ loading ? '正在登录…' : '登 录' }}
          </button>
        </form>

        <div class="demo-accounts">
          <div class="demo-title">
            演示账号：
            <a href="#" @click.prevent="fillDemo('admin')">admin / 123456</a>（管理员）、
            <a href="#" @click.prevent="fillDemo('reader')">reader / 123456</a>（普通用户）
          </div>
        </div>

        <p class="auth-switch">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </p>
      </div>
    </section>
  </div>
</template>
