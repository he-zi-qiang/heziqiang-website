import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './assets/style.css'
import './assets/admin.css'

createApp(App).use(router).mount('#app')

// 告诉 index.html 里的兜底计时器：应用已经接手，静态正文不用放出来了
;(window as Window & { __APP_MOUNTED__?: boolean }).__APP_MOUNTED__ = true
