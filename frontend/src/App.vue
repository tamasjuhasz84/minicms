<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import DynamicForm from './components/DynamicForm.vue'
import AdminEditor from './components/AdminEditor.vue'

const authenticated = ref(false)
const role = ref(null)
const showLogin = ref(false)
const loginForm = ref({
  username: '',
  password: '',
})

const formFields = ref([])
const initialContent = ref(null)

// Axios beállítások
const token = localStorage.getItem('jwt')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Globális válasz interceptor token lejáratra
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      localStorage.removeItem('jwt')
      delete axios.defaults.headers.common['Authorization']
      authenticated.value = false
      role.value = null
      showLogin.value = true
      alert('A munkamenet lejárt. Kérlek, jelentkezz be újra.')
    }
    return Promise.reject(error)
  },
)

function loadContent() {
  axios
    .get('/content')
    .then((res) => {
      initialContent.value = res.data
      formFields.value = res.data.form || []
    })
    .catch((err) => console.error('Hiba a tartalom betöltésekor:', err))
}

function login() {
  axios
    .post('/login', loginForm.value)
    .then((res) => {
      if (res.data.token) {
        localStorage.setItem('jwt', res.data.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      }
      if (res.data.role === 'admin') {
        authenticated.value = true
        role.value = res.data.role
        showLogin.value = false
      } else {
        alert('Csak admin felhasználó léphet be az adminfelületre.')
      }
    })
    .catch((err) => {
      console.error('Hiba a bejelentkezéskor:', err)
      alert('Hibás bejelentkezési adatok.')
    })
}

function logout() {
  authenticated.value = false
  role.value = null
  showLogin.value = false
  loginForm.value.username = ''
  loginForm.value.password = ''
  localStorage.removeItem('jwt')
  delete axios.defaults.headers.common['Authorization']
}

function handleContentUpdate(newContent) {
  initialContent.value = newContent
  formFields.value = newContent.form || []
}

onMounted(() => {
  // Token visszatöltés
  const token = localStorage.getItem('jwt')
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    // Opcionálisan dekódolhatod is, pl. ha a role is kell
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role === 'admin') {
        authenticated.value = true
        role.value = 'admin'
      }
    } catch (err) {
      console.warn('Érvénytelen token:', err)
      localStorage.removeItem('jwt')
    }
  }

  // Tartalom betöltése
  loadContent()
})
</script>

<template>
  <v-app class="app-layout">
    <v-app-bar app>
      <v-toolbar-title>MiniCMS</v-toolbar-title>
      <v-spacer />
      <v-btn text v-if="!authenticated" @click="showLogin = true">Bejelentkezés</v-btn>
      <v-btn text v-else @click="logout">Kilépés</v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <!-- Bejelentkezés -->
        <div v-if="showLogin && !authenticated" class="login-section">
          <h2 class="text-h5 mb-4">Admin bejelentkezés</h2>
          <v-form @submit.prevent="login">
            <v-text-field v-model="loginForm.username" label="Felhasználónév" required />
            <v-text-field v-model="loginForm.password" label="Jelszó" type="password" required />
            <v-btn type="submit" color="primary">Belépés</v-btn>
          </v-form>
        </div>

        <!-- Admin felület -->
        <div v-else-if="authenticated && role === 'admin' && initialContent">
          <AdminEditor
            :initialContent="initialContent"
            @logout="logout"
            @content-updated="handleContentUpdate"
          />
        </div>

        <!-- Publikus felület -->
        <div v-else-if="!showLogin && Array.isArray(formFields) && formFields.length">
          <DynamicForm :formFields="formFields" />
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>
