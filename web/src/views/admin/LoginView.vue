<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useHead } from '@/composables/useHead'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

useHead(() => ({ title: '登录' }))

async function submit() {
  busy.value = true
  error.value = null
  try {
    await login(username.value, password.value)
    const next = typeof route.query.next === 'string' ? route.query.next : '/admin'
    router.replace(next)
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <form class="login-card" @submit.prevent="submit">
      <h1>写作台</h1>
      <p class="sub">这是站点的后台。内容、单页文案与照片都在这里改。</p>

      <p v-if="error" class="notice bad">{{ error }}</p>

      <div class="field">
        <label for="u">用户名</label>
        <input id="u" v-model="username" type="text" autocomplete="username" required />
      </div>
      <div class="field">
        <label for="p">密码</label>
        <input id="p" v-model="password" type="password" autocomplete="current-password" required />
      </div>

      <div class="btn-row">
        <button class="btn primary" type="submit" :disabled="busy">{{ busy ? '登录中…' : '登录' }}</button>
        <RouterLink class="btn" to="/">返回站点</RouterLink>
      </div>
    </form>
  </div>
</template>
