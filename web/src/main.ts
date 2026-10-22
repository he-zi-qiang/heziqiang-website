import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { installPageTransitions } from './composables/pageTransitions'
import './assets/style.css'
import './assets/admin.css'

installPageTransitions(router)

// 图片加载完再淡入（样式见 style.css）。load/error 不冒泡，在捕获阶段统一接住
function markLoaded(event: Event) {
  if (event.target instanceof HTMLImageElement) event.target.classList.add('is-loaded')
}
document.addEventListener('load', markLoaded, true)
document.addEventListener('error', markLoaded, true)

createApp(App).use(router).mount('#app')

// 告诉 index.html 里的兜底计时器：应用已经接手，静态正文不用放出来了
;(window as Window & { __APP_MOUNTED__?: boolean }).__APP_MOUNTED__ = true
