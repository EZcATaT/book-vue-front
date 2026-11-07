import { reactive } from 'vue'

export const confirmState = reactive({
  open: false,
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  danger: false,
  resolve: null
})

export function confirmAction(options = {}) {
  return new Promise((resolve) => {
    confirmState.open = true
    confirmState.title = options.title || '请确认操作'
    confirmState.message = options.message || '确定要执行该操作吗？'
    confirmState.confirmText = options.confirmText || '确定'
    confirmState.cancelText = options.cancelText || '取消'
    confirmState.danger = Boolean(options.danger)
    confirmState.resolve = resolve
  })
}

export function settleConfirm(value) {
  confirmState.open = false
  const resolve = confirmState.resolve
  confirmState.resolve = null
  if (resolve) resolve(value)
}
