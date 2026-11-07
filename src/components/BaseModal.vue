<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  width: { type: String, default: '560px' },
  closeOnMask: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

function handleMask() {
  if (props.closeOnMask) close()
}

function handleKey(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.body.classList.add('modal-open')
  document.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  document.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <teleport to="body">
    <div class="modal-mask" @mousedown.self="handleMask">
      <section class="modal-panel" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
        <header class="modal-head">
          <div>
            <h3>{{ title }}</h3>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
          <button class="modal-close" aria-label="关闭" @click="close">×</button>
        </header>

        <div class="modal-body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="modal-foot">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </teleport>
</template>
