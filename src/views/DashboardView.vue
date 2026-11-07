<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bookApi, borrowApi, userApi } from '@/api'
import { authState, isAdmin } from '@/utils/auth'
import { formatDateTime, greeting, initialOf } from '@/utils/format'
import { notify } from '@/utils/toast'

const router = useRouter()
const loading = ref(true)
const books = ref([])
const borrows = ref([])
const users = ref([])

const displayName = computed(() => authState.user?.name || authState.user?.username || '读者')
const activeBorrows = computed(() => borrows.value.filter((item) => !item.returnTime))
const totalStock = computed(() => books.value.reduce((sum, book) => sum + (book.stock || 0), 0))
const availableBooks = computed(() => books.value.filter((book) => book.stock > 0))
const recentBorrows = computed(() => borrows.value.slice(0, 6))
const topBooks = computed(() =>
  [...books.value].sort((a, b) => b.stock - a.stock).slice(0, 5)
)
const maxStock = computed(() => Math.max(1, ...topBooks.value.map((book) => book.stock || 0)))

const stats = computed(() => {
  if (isAdmin.value) {
    return [
      { label: '馆藏图书', value: books.value.length, unit: '种', hint: '图书种类总数', tone: 'violet' },
      { label: '当前可借', value: totalStock.value, unit: '册', hint: '所有图书剩余库存', tone: 'green' },
      { label: '注册用户', value: users.value.length, unit: '位', hint: '管理员与普通读者', tone: 'blue' },
      { label: '进行中借阅', value: activeBorrows.value.length, unit: '笔', hint: '尚未归还的记录', tone: 'amber' }
    ]
  }
  return [
    { label: '馆藏图书', value: books.value.length, unit: '种', hint: '当前馆藏种类', tone: 'violet' },
    { label: '当前可借', value: totalStock.value, unit: '册', hint: '所有图书剩余库存', tone: 'green' },
    { label: '我的借阅', value: borrows.value.length, unit: '笔', hint: '历史借阅记录', tone: 'blue' },
    { label: '待归还', value: activeBorrows.value.length, unit: '本', hint: '记得按时归还', tone: 'amber' }
  ]
})

async function load() {
  loading.value = true
  try {
    const requests = [bookApi.list(), isAdmin.value ? borrowApi.list() : borrowApi.byUser(authState.user.id)]
    if (isAdmin.value) requests.push(userApi.list())
    const [bookData, borrowData, userData] = await Promise.all(requests)
    books.value = bookData || []
    borrows.value = borrowData || []
    users.value = userData || []
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function go(path) {
  router.push(path)
}

onMounted(load)
</script>

<template>
  <section class="page dashboard-page">
    <div class="welcome-banner">
      <div class="welcome-copy">
        <span class="welcome-eyebrow">LIBRARY DASHBOARD</span>
        <h1>{{ greeting() }}，{{ displayName }}</h1>
        <p v-if="isAdmin">
          今天也来整理一下馆藏吧。你可以在这里查看图书、用户和全部借阅情况。
        </p>
        <p v-else>
          欢迎回到墨卷。挑一本喜欢的书，让阅读成为今天的小确幸。
        </p>
        <div class="welcome-actions">
          <button class="btn btn-light" @click="go('/books')">
            {{ isAdmin ? '管理图书' : '去借一本书' }}
          </button>
          <button class="btn btn-ghost-light" @click="go('/borrows')">查看借阅记录</button>
        </div>
      </div>
      <div class="welcome-art" aria-hidden="true">
        <div class="art-orbit orbit-one"></div>
        <div class="art-orbit orbit-two"></div>
        <div class="art-book art-book-one"><span>阅</span></div>
        <div class="art-book art-book-two"><span>读</span></div>
        <div class="art-book art-book-three"><span>书</span></div>
        <div class="art-dot"></div>
      </div>
    </div>

    <div v-if="loading" class="loading-block">正在加载工作台数据…</div>

    <template v-else>
      <div class="stat-grid">
        <article v-for="item in stats" :key="item.label" class="stat-card" :class="`tone-${item.tone}`">
          <div class="stat-top">
            <span>{{ item.label }}</span>
            <span class="stat-dot"></span>
          </div>
          <div class="stat-value">{{ item.value }}<small>{{ item.unit }}</small></div>
          <p>{{ item.hint }}</p>
        </article>
      </div>

      <div class="quick-grid">
        <button class="quick-card" @click="go('/books')">
          <span class="quick-glyph">书</span>
          <div><strong>{{ isAdmin ? '新增图书' : '浏览馆藏' }}</strong><small>{{ isAdmin ? '录入一本新书' : '看看有哪些好书' }}</small></div>
          <span class="quick-arrow">→</span>
        </button>
        <button class="quick-card" @click="go('/borrows')">
          <span class="quick-glyph">借</span>
          <div><strong>{{ isAdmin ? '借阅管理' : '我的借阅' }}</strong><small>{{ isAdmin ? '查看全部借还记录' : '查看自己的借阅记录' }}</small></div>
          <span class="quick-arrow">→</span>
        </button>
        <button v-if="isAdmin" class="quick-card" @click="go('/users')">
          <span class="quick-glyph">人</span>
          <div><strong>用户管理</strong><small>维护读者账号</small></div>
          <span class="quick-arrow">→</span>
        </button>
        <button v-else class="quick-card" @click="go('/books')">
          <span class="quick-glyph">寻</span>
          <div><strong>发现好书</strong><small>馆内还有 {{ availableBooks.length }} 种可借</small></div>
          <span class="quick-arrow">→</span>
        </button>
      </div>

      <div class="dashboard-grid">
        <section class="card panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">RECENT ACTIVITY</span>
              <h2>最近借阅</h2>
            </div>
            <button class="text-link" @click="go('/borrows')">全部记录 →</button>
          </div>

          <div v-if="recentBorrows.length === 0" class="empty-state compact">
            <div class="empty-mark">阅</div>
            <p>还没有借阅记录</p>
            <button class="btn btn-soft" @click="go('/books')">去借第一本书</button>
          </div>

          <div v-else class="recent-list">
            <div v-for="item in recentBorrows" :key="item.id" class="recent-item">
              <div class="mini-cover">{{ initialOf(item.bookName) }}</div>
              <div class="recent-main">
                <strong>{{ item.bookName || '图书已删除' }}</strong>
                <span>{{ isAdmin ? item.userName : item.borrowTime }}</span>
              </div>
              <div class="recent-time">
                <span>{{ formatDateTime(item.borrowTime) }}</span>
                <span class="badge" :class="item.returnTime ? 'badge-muted' : 'badge-warning'">
                  {{ item.returnTime ? '已归还' : '借阅中' }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="card panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">AVAILABLE NOW</span>
              <h2>馆藏可借</h2>
            </div>
            <span class="muted-text">{{ availableBooks.length }} 种可借</span>
          </div>

          <div class="book-rank-list">
            <div v-for="(book, index) in topBooks" :key="book.id" class="book-rank">
              <span class="rank-index">0{{ index + 1 }}</span>
              <div class="rank-main">
                <div class="rank-title">
                  <strong>{{ book.bookName }}</strong>
                  <span>{{ book.stock }} 册</span>
                </div>
                <div class="rank-bar"><span :style="{ width: `${(book.stock / maxStock) * 100}%` }"></span></div>
                <small>{{ book.author }}</small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </section>
</template>
