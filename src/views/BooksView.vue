<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookApi, borrowApi } from '@/api'
import { authState, isAdmin } from '@/utils/auth'
import { initialOf } from '@/utils/format'
import { notify } from '@/utils/toast'
import { confirmAction } from '@/utils/confirm'
import BaseModal from '@/components/BaseModal.vue'

const route = useRoute()
const router = useRouter()
const books = ref([])
const myActiveBookIds = ref(new Set())
const loading = ref(true)
const keyword = ref('')
const onlyAvailable = ref(false)
const formOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  bookName: '',
  author: '',
  isbn: '',
  stock: 0
})

const totalStock = computed(() => books.value.reduce((sum, book) => sum + (book.stock || 0), 0))
const filteredBooks = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return books.value.filter((book) => {
    const matchKeyword =
      !key ||
      book.bookName?.toLowerCase().includes(key) ||
      book.author?.toLowerCase().includes(key) ||
      book.isbn?.toLowerCase().includes(key)
    const matchStock = !onlyAvailable.value || book.stock > 0
    return matchKeyword && matchStock
  })
})

async function load() {
  loading.value = true
  try {
    if (isAdmin.value) {
      books.value = (await bookApi.list()) || []
    } else {
      const [bookData, borrowData] = await Promise.all([
        bookApi.list(),
        borrowApi.byUser(authState.user.id)
      ])
      books.value = bookData || []
      myActiveBookIds.value = new Set(
        (borrowData || []).filter((item) => !item.returnTime).map((item) => item.bookId)
      )
    }
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function isBorrowed(bookId) {
  return myActiveBookIds.value.has(bookId)
}

function resetForm() {
  form.bookName = ''
  form.author = ''
  form.isbn = ''
  form.stock = 0
  editingId.value = null
  formError.value = ''
}

function openCreate() {
  resetForm()
  formOpen.value = true
}

function openEdit(book) {
  editingId.value = book.id
  form.bookName = book.bookName
  form.author = book.author
  form.isbn = book.isbn
  form.stock = book.stock
  formError.value = ''
  formOpen.value = true
}

function closeForm() {
  if (saving.value) return
  formOpen.value = false
}

async function submitForm() {
  formError.value = ''
  if (!form.bookName.trim() || !form.author.trim() || !form.isbn.trim()) {
    formError.value = '书名、作者和 ISBN 都不能为空'
    return
  }
  if (Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))) {
    formError.value = '库存必须是大于等于 0 的整数'
    return
  }
  saving.value = true
  try {
    const payload = {
      bookName: form.bookName.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      stock: Number(form.stock)
    }
    if (editingId.value) {
      await bookApi.update(editingId.value, payload)
      notify('图书信息已更新')
    } else {
      await bookApi.create(payload)
      notify('新图书已入库')
    }
    formOpen.value = false
    await load()
  } catch (error) {
    formError.value = error.message
  } finally {
    saving.value = false
  }
}

async function removeBook(book) {
  const ok = await confirmAction({
    title: '删除图书',
    message: `确定删除《${book.bookName}》吗？如果存在借阅记录，系统会阻止删除。`,
    confirmText: '删除',
    danger: true
  })
  if (!ok) return
  try {
    await bookApi.remove(book.id)
    notify('图书已删除')
    await load()
  } catch (error) {
    notify(error.message, 'error')
  }
}

async function borrowBook(book) {
  const ok = await confirmAction({
    title: '确认借阅',
    message: `确定借阅《${book.bookName}》吗？借出后库存将自动减 1。`,
    confirmText: '确认借阅'
  })
  if (!ok) return
  try {
    await borrowApi.create({ bookId: book.id })
    notify('借阅成功，请按时归还')
    await load()
  } catch (error) {
    notify(error.message, 'error')
  }
}

function coverTone(id) {
  return `cover-tone-${(id % 5) + 1}`
}

watch(
  () => route.query.create,
  (value) => {
    if (value === '1' && isAdmin.value) {
      openCreate()
      router.replace({ name: 'books' })
    }
  },
  { immediate: true }
)

onMounted(load)
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">BOOK COLLECTION</span>
        <h1>{{ isAdmin ? '图书管理' : '图书借阅' }}</h1>
        <p>{{ isAdmin ? '维护馆藏信息与库存，支持新增、修改和删除。' : '浏览馆藏，选择一本可借的书开始阅读。' }}</p>
      </div>
      <button v-if="isAdmin" class="btn btn-primary" @click="openCreate">＋ 新增图书</button>
    </div>

    <div class="summary-strip">
      <div><span>图书种类</span><strong>{{ books.length }}<small>种</small></strong></div>
      <div><span>可借库存</span><strong>{{ totalStock }}<small>册</small></strong></div>
      <div><span>当前筛选</span><strong>{{ filteredBooks.length }}<small>条</small></strong></div>
      <div class="summary-tip">
        <span class="tip-dot"></span>
        {{ isAdmin ? '库存为 0 的图书仍会保留在列表中' : '库存为 0 时暂时无法借阅' }}
      </div>
    </div>

    <section class="card">
      <div class="toolbar">
        <div class="search-box">
          <span class="search-glyph">⌕</span>
          <input v-model="keyword" type="search" placeholder="搜索书名、作者或 ISBN" />
        </div>
        <label class="check-label">
          <input v-model="onlyAvailable" type="checkbox" />
          <span>只看有库存</span>
        </label>
        <span class="toolbar-count">共 {{ filteredBooks.length }} 条结果</span>
      </div>

      <div v-if="loading" class="loading-block">正在加载图书…</div>

      <div v-else-if="filteredBooks.length === 0" class="empty-state">
        <div class="empty-mark">书</div>
        <h3>没有找到图书</h3>
        <p>试试更换搜索关键词，或让管理员先录入图书。</p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>图书信息</th>
              <th>ISBN</th>
              <th>库存</th>
              <th>状态</th>
              <th class="align-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredBooks" :key="book.id">
              <td>
                <div class="book-cell">
                  <div class="book-cover" :class="coverTone(book.id)">{{ initialOf(book.bookName) }}</div>
                  <div>
                    <strong>{{ book.bookName }}</strong>
                    <span>{{ book.author }}</span>
                  </div>
                </div>
              </td>
              <td><span class="mono-text">{{ book.isbn }}</span></td>
              <td>
                <div class="stock-cell">
                  <strong>{{ book.stock }}</strong>
                  <span>册</span>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="isBorrowed(book.id) ? 'badge-warning' : book.stock > 0 ? 'badge-success' : 'badge-muted'"
                >
                  {{ isBorrowed(book.id) ? '借阅中' : book.stock > 0 ? '可借阅' : '暂无库存' }}
                </span>
              </td>
              <td class="align-right">
                <div class="row-actions">
                  <template v-if="isAdmin">
                    <button class="btn btn-mini btn-ghost" @click="openEdit(book)">编辑</button>
                    <button class="btn btn-mini btn-danger-soft" @click="removeBook(book)">删除</button>
                  </template>
                  <button
                    v-else
                    class="btn btn-mini btn-primary"
                    :disabled="book.stock <= 0 || isBorrowed(book.id)"
                    @click="borrowBook(book)"
                  >
                    {{ isBorrowed(book.id) ? '已借阅' : book.stock <= 0 ? '暂无库存' : '借阅' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal
      v-if="formOpen"
      :title="editingId ? '编辑图书' : '新增图书'"
      subtitle="请填写图书的基本信息，库存表示当前可借数量。"
      @close="closeForm"
    >
      <div v-if="formError" class="form-error">{{ formError }}</div>
      <form class="form-grid" @submit.prevent="submitForm">
        <label class="field">
          <span>书名 <em>*</em></span>
          <input v-model="form.bookName" type="text" placeholder="例如：三体" maxlength="100" />
        </label>
        <label class="field">
          <span>作者 <em>*</em></span>
          <input v-model="form.author" type="text" placeholder="例如：刘慈欣" maxlength="50" />
        </label>
        <label class="field">
          <span>ISBN <em>*</em></span>
          <input v-model="form.isbn" type="text" placeholder="例如：9787536692930" maxlength="20" />
        </label>
        <label class="field">
          <span>库存数量 <em>*</em></span>
          <input v-model.number="form.stock" type="number" min="0" step="1" placeholder="0" />
        </label>
      </form>
      <template #footer>
        <button class="btn btn-ghost" :disabled="saving" @click="closeForm">取消</button>
        <button class="btn btn-primary" :disabled="saving" @click="submitForm">
          {{ saving ? '保存中…' : '保存图书' }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>
