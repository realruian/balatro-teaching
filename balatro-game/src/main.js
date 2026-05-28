import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import { initAudio } from './utils/audio.js'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

// 注册音频初始化（监听首次用户交互来启动 BGM）
initAudio()
