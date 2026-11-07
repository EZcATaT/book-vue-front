<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { notify } from '@/utils/toast'

const router = useRouter()
const form = reactive({
  username: '',
  name: '',
  password: '',
  confirmPassword: ''
})
const loading = ref(false)
const errorMessage = ref('')

async function submit() {
  errorMessage.value = ''
  const username = form.username.trim()
  const name = form.name.trim()

  if (!username || !name || !form.password || !form.confirmPassword) {
    errorMessage.value = '请完整填写所有注册信息'
    return
  }
  if (username.length < 3) {
    errorMessage.value = '账号至少需要 3 个字符'
    return
  }
  if (form.password.length < 6) {
    errorMessage.value = '密码至少需要 6 个字符'
    return
  }
  if (form.password !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    await authApi.register({ username, name, password: form.password })
    notify('注册成功，请登录', 'success')
    router.replace({ name: 'login', query: { registered: 1, username } })
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page register-page">
    <section class="auth-visual">
      <div class="visual-brand">
        <div class="brand-mark large">书</div>
        <div>
          <strong>墨卷</strong>
          <span>图书借阅管理系统</span>
        </div>
      </div>

      <div class="visual-copy">
        <div class="visual-eyebrow">JOIN THE LIBRARY</div>
        <h1>从一本好书<br /><em>开始新的故事</em></h1>
        <p>
          注册成为普通读者，即可浏览馆藏、借阅图书、查看自己的借阅记录。
          管理员账号由系统统一维护。
        </p>
      </div>

      <div class="register-steps">
        <div class="register-step">
          <span>1</span>
          <div><strong>创建账号</strong><p>填写账号、姓名和密码</p></div>
        </div>
        <div class="register-step">
          <span>2</span>
          <div><strong>登录系统</strong><p>使用新账号登录</p></div>
        </div>
        <div class="register-step">
          <span>3</span>
          <div><strong>开始借阅</strong><p>在图书列表中挑选想读的书</p></div>
        </div>
      </div>

      <div class="visual-quote">
        <span>“</span>
        <p>读书百遍，其义自见。</p>
        <small>—— 《三国志》</small>
      </div>
    </section>

    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-mobile-brand">
          <div class="brand-mark">书</div>
          <strong>墨卷</strong>
        </div>

        <div class="auth-heading">
          <span class="eyebrow">CREATE ACCOUNT</span>
          <h2>注册读者账号</h2>
          <p>注册后默认为普通用户，可借阅图书和管理自己的记录。</p>
        </div>

        <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>

        <form class="auth-form" @submit.prevent="submit">
          <div class="form-row two">
            <label class="field">
              <span>登录账号</span>
              <input v-model="form.username" type="text" placeholder="至少 3 个字符" maxlength="50" />
            </label>
            <label class="field">
              <span>姓名</span>
              <input v-model="form.name" type="text" placeholder="请输入真实姓名" maxlength="50" />
            </label>
          </div>

          <label class="field">
            <span>设置密码</span>
            <input
              v-model="form.password"
              type="password"
              placeholder="至少 6 个字符"
              autocomplete="new-password"
              maxlength="100"
            />
          </label>

          <label class="field">
            <span>确认密码</span>
            <input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              autocomplete="new-password"
              maxlength="100"
            />
          </label>

          <button class="btn btn-primary btn-block auth-submit" :disabled="loading">
            {{ loading ? '正在注册…' : '注册账号' }}
          </button>
        </form>

        <p class="auth-switch">
          已经有账号？
          <router-link to="/login">返回登录</router-link>
        </p>
      </div>
    </section>
  </div>
</template>
