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
    <section class="auth-visual">
      <div class="visual-brand">
        <div class="brand-mark large">书</div>
        <div>
          <strong>墨卷</strong>
          <span>图书借阅管理系统</span>
        </div>
      </div>

      <div class="visual-copy">
        <div class="visual-eyebrow">LIBRARY · BORROW · RETURN</div>
        <h1>让每一本书<br /><em>都有迹可循</em></h1>
        <p>
          用更简单的方式管理馆藏、读者与借阅记录。登录后即可浏览图书、办理借还，
          管理员还能管理全部用户和借阅数据。
        </p>
      </div>

      <div class="visual-features">
        <div class="feature-item">
          <span class="feature-index">01</span>
          <div><strong>馆藏清晰</strong><span>图书信息与库存一目了然</span></div>
        </div>
        <div class="feature-item">
          <span class="feature-index">02</span>
          <div><strong>借还联动</strong><span>借书自动减库存，还书自动恢复</span></div>
        </div>
        <div class="feature-item">
          <span class="feature-index">03</span>
          <div><strong>角色分明</strong><span>管理员与普通用户各司其职</span></div>
        </div>
      </div>

      <div class="visual-quote">
        <span>“</span>
        <p>书籍是人类进步的阶梯。</p>
        <small>—— 高尔基</small>
      </div>
    </section>

    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-mobile-brand">
          <div class="brand-mark">书</div>
          <strong>墨卷</strong>
        </div>

        <div class="auth-heading">
          <span class="eyebrow">WELCOME BACK</span>
          <h2>欢迎回来</h2>
          <p>登录你的账号，继续今天的阅读与管理。</p>
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
          <div class="demo-title"><span></span>演示账号<span></span></div>
          <div class="demo-buttons">
            <button type="button" @click="fillDemo('admin')">
              <strong>管理员</strong>
              <span>admin / 123456</span>
            </button>
            <button type="button" @click="fillDemo('reader')">
              <strong>普通用户</strong>
              <span>reader / 123456</span>
            </button>
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
