<script setup>
import BaseModal from './BaseModal.vue'
import { confirmState, settleConfirm } from '@/utils/confirm'
</script>

<template>
  <BaseModal
    v-if="confirmState.open"
    :title="confirmState.title"
    width="440px"
    :close-on-mask="false"
    @close="settleConfirm(false)"
  >
    <p class="confirm-message">{{ confirmState.message }}</p>
    <template #footer>
      <button class="btn btn-ghost" @click="settleConfirm(false)">{{ confirmState.cancelText }}</button>
      <button
        class="btn"
        :class="confirmState.danger ? 'btn-danger' : 'btn-primary'"
        @click="settleConfirm(true)"
      >
        {{ confirmState.confirmText }}
      </button>
    </template>
  </BaseModal>
</template>
