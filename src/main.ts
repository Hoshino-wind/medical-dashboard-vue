import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { installGlobalErrorReporting } from './app/errorReporting'

import './assets/fonts/dashboard-subset-fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/header.css'
import './styles/panel-core.css'
import './styles/panel-title.css'
import './styles/panel-borderless.css'
import './styles/panel-chamfered.css'
import './styles/rings.css'
import './styles/rings-light.css'
import './styles/modules.css'
import './styles/modules-health.css'
import './styles/modules-light.css'
import './styles/tables.css'
import './styles/charts.css'
import './styles/config.css'

const app = createApp(App)

installGlobalErrorReporting(app)
app.use(createPinia())
app.use(router)

app.mount('#app')
