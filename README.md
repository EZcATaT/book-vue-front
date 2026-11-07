# 图书借阅管理系统 · 前端

基于 **Vue 3 + Vite + Vue Router + Axios** 的图书借阅管理系统前端，配合 Spring Boot 后端使用。

后端仓库：`book-springboot-back`  
默认前端地址：`http://127.0.0.1:5173`  
默认后端地址：`http://127.0.0.1:8080`

---

## 1. 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | Vue 3.5 |
| 构建工具 | Vite 5 |
| 路由 | Vue Router 4 |
| HTTP | Axios |
| 语言 | JavaScript |
| 样式 | 原生 CSS（自定义紫色主题） |

按课程要求采用精简方案，没有使用 TypeScript、Pinia 和 UI 组件库。

---

## 2. 页面与功能

| 页面 | 路由 | 管理员 | 普通用户 |
| --- | --- | --- | --- |
| 登录 | `/login` | 可用 | 可用 |
| 注册 | `/register` | 可用 | 可用 |
| 工作台 | `/dashboard` | 馆藏、用户、借阅统计 | 馆藏、个人借阅统计 |
| 图书 | `/books` | 新增、编辑、删除 | 浏览、借阅 |
| 借阅记录 | `/borrows` | 全部记录、新增借阅、归还、删除 | 查看自己的记录、归还 |
| 用户管理 | `/users` | 新增、编辑、删除 | 无权限，路由拦截 |

### 交互细节

- 登录后保存 token 和用户信息到 `localStorage`
- Axios 请求自动添加 `Authorization: Bearer <token>`
- 登录失效时自动清理本地状态并返回登录页
- 借书、还书、删除均有确认弹窗
- 操作结果用顶部 Toast 提示
- 普通用户已借阅且未归还的图书显示“已借阅”，不能重复点击
- 响应式布局，支持手机宽度

---

## 3. 项目结构

```text
book-vue-front
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.js
    ├── App.vue
    ├── api/
    │   ├── http.js             # Axios 实例与拦截器
    │   └── index.js            # RESTful 接口封装
    ├── assets/
    │   └── styles.css          # 全局样式与响应式布局
    ├── components/
    │   ├── AppLayout.vue       # 侧边栏 + 顶栏
    │   ├── BaseModal.vue
    │   ├── ConfirmHost.vue
    │   └── ToastHost.vue
    ├── router/
    │   └── index.js            # 路由与登录/角色守卫
    ├── utils/
    │   ├── auth.js             # 登录状态
    │   ├── confirm.js          # 确认弹窗
    │   ├── format.js
    │   └── toast.js
    └── views/
        ├── LoginView.vue
        ├── RegisterView.vue
        ├── DashboardView.vue
        ├── BooksView.vue
        ├── BorrowsView.vue
        └── UsersView.vue
```

---

## 4. 本地运行

### 4.1 准备后端

先启动 `book-springboot-back`，确认以下地址可访问：

```text
http://localhost:8080/api/health
```

### 4.2 安装依赖

```bash
npm install
```

国内网络较慢时可以使用镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

### 4.3 启动开发服务器

```bash
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:5173
```

### 4.4 修改后端地址

默认请求 `http://127.0.0.1:8080/api`。如果后端端口或地址不同：

1. 复制 `.env.example` 为 `.env`
2. 修改：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8080/api
```

修改后重新启动 `npm run dev`。

---

## 5. 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `admin` | `123456` | 管理员 |
| `reader` | `123456` | 普通用户 |
| `lisi` | `123456` | 普通用户 |

登录页提供了一键填充演示账号的按钮。

---

## 6. 生产构建

```bash
npm run build
```

构建产物在 `dist/`。

本地预览：

```bash
npm run preview
```

部署到 Nginx 时，需要为 Vue Router 的 history 模式配置回退：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

如果前后端部署在不同域名，修改 `.env` 中的 `VITE_API_BASE_URL`，并确认后端 CORS 配置允许该域名。

---

## 7. 与后端的对应关系

前端统一调用 `/api` 下的 RESTful 接口：

| 页面操作 | 前端调用 |
| --- | --- |
| 登录 | `POST /api/auth/login` |
| 注册 | `POST /api/auth/register` |
| 退出 | `POST /api/auth/logout` |
| 图书列表 | `GET /api/books` |
| 新增/编辑/删除图书 | `POST /api/books`、`PUT/DELETE /api/books/{id}` |
| 全部借阅 | `GET /api/borrows` |
| 我的借阅 | `GET /api/users/{userId}/borrows` |
| 借书 | `POST /api/borrows` |
| 还书 | `PUT /api/borrows/{id}` |
| 用户管理 | `GET/POST /api/users`、`PUT/DELETE /api/users/{id}` |

完整参数说明见后端仓库的 `docs/API.md`。

---

## 8. 常见问题

### 页面提示“网络请求失败，请检查后端是否启动”

- 检查后端 8080 端口是否启动
- 检查 `.env` 中的 `VITE_API_BASE_URL` 是否正确
- 浏览器控制台查看是否有跨域错误

### 登录后马上跳回登录页

- 后端重启会导致内存令牌失效，重新登录即可
- 检查浏览器是否禁用了 `localStorage`

### 刷新页面 404

这是 history 路由在普通静态服务器上的表现。开发时使用 `npm run dev`，生产部署需要配置 Nginx 的 `try_files` 回退。

---

## 9. Git

远程仓库：

```text
https://github.com/EZcATaT/book-vue-front.git
```

建议提交信息：

```text
feat: 完成登录注册与角色路由
feat: 完成图书借阅页面
style: 完善紫色主题与响应式布局
docs: 补充前端运行说明
```
