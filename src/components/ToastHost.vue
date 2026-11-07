<script setup>
import { toasts, removeToast } from '@/utils/toast'
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="item in toasts" :key="item.id" class="toast" :class="`toast-${item.type}`">
        <span class="toast-icon">{{ item.type === 'error' ? '!' : item.type === 'info' ? 'i' : '✓' }}</span>
        <span class="toast-message">{{ item.message }}</span>
        <button class="toast-close" @click="removeToast(item.id)">×</button>
      </div>
    </TransitionGroup>
  </div>
</template>
