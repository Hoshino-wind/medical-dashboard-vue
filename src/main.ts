import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import './styles/tokens.css'
import './styles/motion.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/header.css'
import './styles/panel.css'
import './styles/rings.css'
import './styles/modules.css'
import './styles/tables.css'
import './styles/charts.css'
import './styles/config.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
