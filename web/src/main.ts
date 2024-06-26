import { createApp } from 'vue'
import './style.css'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

app.mount('#app')
