import { createApp } from 'vue'
import App from './App.vue'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import axios from '@/utils/axios'

// 🔐 Axios interceptor a JWT tokenhez
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const vuetify = createVuetify({ components })

createApp(App).use(vuetify).mount('#app')
