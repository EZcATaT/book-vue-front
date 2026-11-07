<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { userApi } from '@/api'
import { authState } from '@/utils/auth'
import { initialOf } from '@/utils/format'
import { notify } from '@/utils/toast'
import { confirmAction } from '@/utils/confirm'
import BaseModal from '@/components/BaseModal.vue'

const users = ref([])
const loading = ref(true)
const keyword = ref('')
const formOpen = ref(false)
const editingId = ref(null)
const editingUsername = ref('')
const saving = ref(false)
const formError = ref('')
const form = reactive({
  username: '',
  name: '',
  password: ''
})

const filteredUsers = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return users.value
  return users.value.filter(
    (user) =>
      user.username?.toLowerCase().includes(key) ||
      user.name?.toLowerCase().includes(key)
  )
})

const adminCount = computed(() => users.value.filter((user) => user.role === 'admin').length)
const readerCount = computed(() => users.value.filter((user) => user.role === 'user').length)

async function load() {
  loading.value = true
  try {
    users.value = (await userApi.list()) || []
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.username = ''
  form.name = ''
  form.password = ''
  editingId.value = null
  editingUsername.value = ''
  formError.value = ''
}

function openCreate() {
  resetForm()
  formOpen.value = true
}

function openEdit(user) {
  resetForm()
  editingId.value = user.id
  editingUsername.value = user.username
  form.username = user.username
  form.name = user.name
  formOpen.value = true
}

function closeForm() {
  if (saving.value) return
  formOpen.value = false
}

async function submitForm() {
  formError.value = ''
  if (!form.username.trim() || !form.name.trim()) {
    formError.value = '账号和姓名不能为空'
    return
  }
  if (!editingId.value && !form.password) {
    formError.value = '新增用户时必须设置初始密码'
    return
  }
  if (form.password && form.password.length < 6) {
    formError.value = '密码至少需要 6 个字符'
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      const payload = { username: form.username.trim(), name: form.name.trim() }
      if (form.password) payload.password = form.password
      await userApi.update(editingId.value, payload)
      notify('用户信息已更新')
    } else {
      await userApi.create({
        username: form.username.trim(),
        name: form.name.trim(),
        password: form.password
      })
      notify('用户已创建')
    }
    formOpen.value = false
    await load()
  } catch (error) {
    formError.value = error.message
  } finally {
    saving.value = false
  }
}

async function removeUser(user) {
  const ok = await confirmAction({
    title: '删除用户',
    message: `确定删除用户“${user.name}（${user.username}）”吗？如果存在借阅记录，系统会阻止删除。`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await userApi.remove(user.id)
    notify('用户已删除')
    await load()
  } catch (error) {
    notify(error.message, 'error')
  }
}

onMounted(load)
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">USER MANAGEMENT</span>
        <h1>用户管理</h1>
        <p>维护系统的管理员和普通读者账号。管理员账号固定为 admin。</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">＋ 新增用户</button>
    </div>

    <div class="summary-strip">
      <div><span>用户总数</span><strong>{{ users.length }}<small>位</small></strong></div>
      <div><span>管理员</span><strong>{{ adminCount }}<small>位</small></strong></div>
      <div><span>普通读者</span><strong>{{ readerCount }}<small>位</small></strong></div>
      <div class="summary-tip">
        <span class="tip-dot"></span>
        当前登录：{{ authState.user?.name }}
      </div>
    </div>

    <section class="card">
      <div class="toolbar">
        <div class="search-box">
          <span class="search-glyph">⌕</span>
          <input v-model="keyword" type="search" placeholder="搜索账号或姓名" />
        </div>
        <span class="toolbar-count">共 {{ filteredUsers.length }} 位用户</span>
      </div>

      <div v-if="loading" class="loading-block">正在加载用户…</div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <div class="empty-mark">人</div>
        <h3>没有找到用户</h3>
        <p>试试更换搜索关键词。</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>登录账号</th>
              <th>角色</th>
              <th>用户 ID</th>
              <th class="align-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <span class="avatar small">{{ initialOf(user.name) }}</span>
                  <div>
                    <strong>{{ user.name }}</strong>
                    <span v-if="user.id === authState.user?.id" class="self-mark">当前账号</span>
                  </div>
                </div>
              </td>
              <td><span class="mono-text">{{ user.username }}</span></td>
              <td>
                <span class="badge" :class="user.role === 'admin' ? 'badge-admin' : 'badge-user'">
                  {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                </span>
              </td>
              <td><span class="muted-text">#{{ user.id }}</span></td>
              <td class="align-right">
                <div class="row-actions">
                  <button class="btn btn-mini btn-ghost" @click="openEdit(user)">编辑</button>
                  <button
                    v-if="user.username !== 'admin'"
                    class="btn btn-mini btn-danger-soft"
                    @click="removeUser(user)"
                  >
                    删除
                  </button>
                  <span v-else class="muted-text">系统账号</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal
      v-if="formOpen"
      :title="editingId ? '编辑用户' : '新增用户'"
      :subtitle="editingId ? '密码留空表示不修改原密码。' : '新用户默认是普通读者，不能通过此页面创建管理员。'"
      @close="closeForm"
    >
      <div v-if="formError" class="form-error">{{ formError }}</div>
      <form class="form-grid" @submit.prevent="submitForm">
        <label class="field">
          <span>登录账号 <em>*</em></span>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入登录账号"
            maxlength="50"
            :disabled="editingUsername === 'admin'"
          />
        </label>
        <label class="field">
          <span>姓名 <em>*</em></span>
          <input v-model="form.name" type="text" placeholder="请输入姓名" maxlength="50" />
        </label>
        <label class="field">
          <span>{{ editingId ? '新密码（留空不修改）' : '初始密码' }} <em v-if="!editingId">*</em></span>
          <input
            v-model="form.password"
            type="password"
            :placeholder="editingId ? '不修改请留空' : '至少 6 个字符'"
            autocomplete="new-password"
            maxlength="100"
          />
        </label>
      </form>
      <template #footer>
        <button class="btn btn-ghost" :disabled="saving" @click="closeForm">取消</button>
        <button class="btn btn-primary" :disabled="saving" @click="submitForm">
          {{ saving ? '保存中…' : '保存用户' }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>
