import { ref, watchEffect } from 'vue'

const MODE_KEY = 'hz-mode'
export type Mode = 'pro' | 'personal'

function initial(): Mode {
  const param = new URLSearchParams(location.search).get('mode')
  if (param === 'personal' || param === 'pro') return param
  try {
    return localStorage.getItem(MODE_KEY) === 'personal' ? 'personal' : 'pro'
  } catch {
    return 'pro'
  }
}

/**
 * 「专业 / 个人」双身份。
 * 仍然把 data-mode 写在 <body> 上——样式表里 [data-mode="pro"] .only-personal 这条规则原样沿用。
 */
const mode = ref<Mode>(initial())

watchEffect(() => {
  document.body.setAttribute('data-mode', mode.value)
})

export function useMode() {
  function setMode(next: Mode, persist = true) {
    if (mode.value === next) return
    mode.value = next
    if (!persist) return
    try {
      localStorage.setItem(MODE_KEY, next)
    } catch { /* 忽略 */ }
  }
  return { mode, setMode }
}
