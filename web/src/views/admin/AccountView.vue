<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { useHead } from '@/composables/useHead'

const { user } = useAuth()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const saving = ref(false)

async function submit() {
  error.value = null
  message.value = null
  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的新密码不一致'
    return
  }
  saving.value = true
  try {
    await api.auth.changePassword(currentPassword.value, newPassword.value)
    message.value = '密码已更新，下次登录用新密码'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    saving.value = false
  }
}

useHead(() => ({ title: '账号' }))
</script>

<template>
  <h1 class="admin-title">账号</h1>
  <p class="admin-sub">
    当前登录：<strong>{{ user?.displayName }}</strong>（{{ user?.username }}）。
    首次部署后请立刻把 seed 时的初始密码改掉。
  </p>

  <p v-if="error" class="notice bad">{{ error }}</p>
  <p v-else-if="message" class="notice ok">{{ message }}</p>

  <form style="max-width: 420px" @submit.prevent="submit">
    <div class="field">
      <label for="cur">当前密码</label>
      <input id="cur" v-model="currentPassword" type="password" autocomplete="current-password" required />
    </div>
    <div class="field">
      <label for="new">新密码</label>
      <input id="new" v-model="newPassword" type="password" autocomplete="new-password" required minlength="8" />
      <span class="hint">至少 8 位。</span>
    </div>
    <div class="field">
      <label for="cfm">再输一次</label>
      <input id="cfm" v-model="confirmPassword" type="password" autocomplete="new-password" required />
    </div>
    <div class="btn-row">
      <button class="btn primary" type="submit" :disabled="saving">{{ saving ? '提交中…' : '修改密码' }}</button>
    </div>
  </form>
</template>
