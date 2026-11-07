<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bookApi, borrowApi, userApi } from '@/api'
import { authState, isAdmin } from '@/utils/auth'
import { formatDateTime, initialOf } from '@/utils/format'
import { notify } from '@/utils/toast'
import { confirmAction } from '@/utils/confirm'
import BaseModal from '@/components/BaseModal.vue'

const router = useRouter()
const records = ref([])
const users = ref([])
const books = ref([])
const loading = ref(true)
const statusFilter = ref('all')
const keyword = ref('')
const addOpen = ref(false)
const adding = ref(false)
const formError = ref('')
const form = reactive({ userId: '', bookId: '' })

const activeCount = computed(() => records.value.filter((item) => !item.returnTime).length)
const returnedCount = computed(() => records.value.filter((item) => item.returnTime).length)

const filteredRecords = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return records.value.filter((item) => {
    const matchStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && !item.returnTime) ||
      (statusFilter.value === 'returned' && item.returnTime)
    const matchKeyword =
      !key ||
      item.bookName?.toLowerCase().includes(key) ||
      item.userName?.toLowerCase().includes(key)
    return matchStatus && matchKeyword
  })
})

const statusOptions = computed(() => [
  { value: 'all', label: '全部记录', count: records.value.length },
  { value: 'active', label: '借阅中', count: activeCount.value },
  { value: 'returned', label: '已归还', count: returnedCount.value }
])

const availableBooks = computed(() => books.value.filter((book) => book.stock > 0))

async function load() {
  loading.value = true
  try {
    if (isAdmin.value) {
      const [recordData, userData, bookData] = await Promise.all([
        borrowApi.list(),
        userApi.list(),
        bookApi.list()
      ])
      records.value = recordData || []
      users.value = userData || []
      books.value = bookData || []
    } else {
      records.value = (await borrowApi.byUser(authState.user.id)) || []
    }
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function openAdd() {
  form.userId = ''
  form.bookId = ''
  formError.value = ''
  addOpen.value = true
}

async function submitAdd() {
  formError.value = ''
  if (!form.userId || !form.bookId) {
    formError.value = '请选择借阅用户和图书'
    return
  }
  adding.value = true
  try {
    await borrowApi.create({
      userId: Number(form.userId),
      bookId: Number(form.bookId)
    })
    notify('借阅记录已创建')
    addOpen.value = false
    await load()
  } catch (error) {
    formError.value = error.message
  } finally {
    adding.value = false
  }
}

async function returnBook(item) {
  const ok = await confirmAction({
    title: '确认归还',
    message: `确认归还《${item.bookName}》吗？归还后库存会自动加 1。`,
    confirmText: '确认归还'
  })
  if (!ok) return
  try {
    await borrowApi.returnBook(item.id)
    notify('归还成功')
    await load()
  } catch (error) {
    notify(error.message, 'error')
  }
}

async function removeRecord(item) {
  const ok = await confirmAction({
    title: '删除借阅记录',
    message: `确定删除《${item.bookName}》的这条借阅记录吗？如果尚未归还，库存会一并恢复。`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await borrowApi.remove(item.id)
    notify('借阅记录已删除')
    await load()
  } catch (error) {
    notify(error.message, 'error')
  }
}

function goBorrowBooks() {
  router.push('/books')
}

onMounted(load)
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">BORROW RECORDS</span>
        <h1>{{ isAdmin ? '借阅管理' : '我的借阅' }}</h1>
        <p>{{ isAdmin ? '查看全部借还记录，办理归还或删除记录。' : '查看自己的借阅历史，归还尚未归还的图书。' }}</p>
      </div>
      <button v-if="isAdmin" class="btn btn-primary" @click="openAdd">＋ 新增借阅</button>
      <button v-else class="btn btn-primary" @click="goBorrowBooks">去借一本书</button>
    </div>

    <div class="summary-strip">
      <div><span>记录总数</span><strong>{{ records.length }}<small>笔</small></strong></div>
      <div><span>借阅中</span><strong>{{ activeCount }}<small>笔</small></strong></div>
      <div><span>已归还</span><strong>{{ returnedCount }}<small>笔</small></strong></div>
      <div class="summary-tip">
        <span class="tip-dot"></span>
        {{ isAdmin ? '删除未归还记录时，库存会自动补回' : '归还后库存自动恢复，可再次借阅' }}
      </div>
    </div>

    <section class="card">
      <div class="toolbar toolbar-wrap">
        <div class="segmented">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            :class="{ active: statusFilter === option.value }"
            @click="statusFilter = option.value"
          >
            {{ option.label }}
            <span>{{ option.count }}</span>
          </button>
        </div>
        <div class="search-box">
          <span class="search-glyph">⌕</span>
          <input v-model="keyword" type="search" placeholder="搜索书名或借阅人" />
        </div>
      </div>

      <div v-if="loading" class="loading-block">正在加载借阅记录…</div>

      <div v-else-if="filteredRecords.length === 0" class="empty-state">
        <div class="empty-mark">借</div>
        <h3>暂无相关记录</h3>
        <p>{{ isAdmin ? '可以通过“新增借阅”为读者登记借书。' : '去图书列表挑一本喜欢的书吧。' }}</p>
        <button class="btn btn-soft" @click="isAdmin ? openAdd() : goBorrowBooks()">
          {{ isAdmin ? '新增借阅' : '去借书' }}
        </button>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>借阅人</th>
              <th>图书</th>
              <th>借阅时间</th>
              <th>归还时间</th>
              <th>状态</th>
              <th class="align-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredRecords" :key="item.id">
              <td>
                <div class="user-cell">
                  <span class="mini-avatar">{{ initialOf(item.userName) }}</span>
                  <span>{{ item.userName || '未知用户' }}</span>
                </div>
              </td>
              <td>
                <div class="book-cell compact">
                  <div class="book-cover small">{{ initialOf(item.bookName) }}</div>
                  <strong>{{ item.bookName || '图书已删除' }}</strong>
                </div>
              </td>
              <td><span class="date-text">{{ formatDateTime(item.borrowTime) }}</span></td>
              <td><span class="date-text">{{ formatDateTime(item.returnTime) }}</span></td>
              <td>
                <span class="badge" :class="item.returnTime ? 'badge-success' : 'badge-warning'">
                  {{ item.returnTime ? '已归还' : '借阅中' }}
                </span>
              </td>
              <td class="align-right">
                <div class="row-actions">
                  <button
                    v-if="!item.returnTime"
                    class="btn btn-mini btn-soft"
                    @click="returnBook(item)"
                  >
                    归还
                  </button>
                  <button
                    v-if="isAdmin"
                    class="btn btn-mini btn-danger-soft"
                    @click="removeRecord(item)"
                  >
                    删除
                  </button>
                  <span v-if="item.returnTime && !isAdmin" class="muted-text">已完成</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal
      v-if="addOpen"
      title="新增借阅记录"
      subtitle="选择读者和图书后，系统会自动扣减库存并记录借阅时间。"
      @close="addOpen = false"
    >
      <div v-if="formError" class="form-error">{{ formError }}</div>
      <form class="form-grid" @submit.prevent="submitAdd">
        <label class="field">
          <span>借阅用户 <em>*</em></span>
          <select v-model="form.userId">
            <option value="" disabled>请选择用户</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }}（{{ user.username }}）
            </option>
          </select>
        </label>
        <label class="field">
          <span>借阅图书 <em>*</em></span>
          <select v-model="form.bookId">
            <option value="" disabled>请选择图书</option>
            <option v-for="book in availableBooks" :key="book.id" :value="book.id">
              {{ book.bookName }}（库存 {{ book.stock }}）
            </option>
          </select>
        </label>
        <p class="form-hint">仅显示当前有库存的图书；同一用户不能重复借阅同一本未归还的书。</p>
      </form>
      <template #footer>
        <button class="btn btn-ghost" :disabled="adding" @click="addOpen = false">取消</button>
        <button class="btn btn-primary" :disabled="adding" @click="submitAdd">
          {{ adding ? '提交中…' : '确认借阅' }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>
