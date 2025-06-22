<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  formFields: {
    type: Array,
    required: true,
  },
})

const formData = ref({})
const selectOptions = ref({})
const result = ref(null)
const header = ref({})
const footer = ref({})
const showLogin = ref(false)
const authenticated = ref(false)
const loginForm = ref({ username: '', password: '' })

const enabledFields = computed(() => {
  return Array.isArray(props.formFields)
    ? props.formFields.filter((field) => field.enabled !== false)
    : []
})

watch(
  () => props.formFields,
  () => {
    initFormData()
    loadSelects()
  },
  { immediate: true },
)

onMounted(() => {
  axios.get('/content').then((res) => {
    header.value = res.data.header || {}
    footer.value = res.data.footer || {}
  })
})

function initFormData() {
  formData.value = {}
  if (!Array.isArray(props.formFields)) return
  props.formFields.forEach((field) => {
    formData.value[field.name] = field.type === 'switch' ? false : ''
  })
}

function loadSelects() {
  if (!Array.isArray(props.formFields)) return
  const apiFields = props.formFields.filter((f) => f.type === 'select' && f.source)
  apiFields.forEach((field) => {
    axios
      .get(field.source)
      .then((res) => {
        let options = []

        if (field.sourceField && Array.isArray(res.data[field.sourceField])) {
          options = res.data[field.sourceField]
        } else if (typeof res.data === 'object') {
          const values = Object.values(res.data)
          options = values.find((v) => Array.isArray(v)) || []
        }

        selectOptions.value[field.name] = options
      })
      .catch((err) => {
        console.error(`Hiba a(z) ${field.source} betöltésekor`, err)
      })
  })
}

function getSelectItems(field) {
  if (Array.isArray(field.options)) {
    return field.options.map((opt) => ({ text: opt.text, value: opt.value }))
  }
  if (typeof field.options === 'object' && field.options !== null) {
    const array = Object.values(field.options).find((v) => Array.isArray(v))
    if (array) {
      return array.map((opt) => ({ text: opt.text, value: opt.value }))
    }
  }
  const data = selectOptions.value[field.name]
  return Array.isArray(data) ? data : []
}

function calculateAndSubmit() {
  if (!formData.value.active) {
    alert('A kalkuláció csak akkor engedélyezett, ha a "Beküldhető" mező be van kapcsolva.')
    return
  }

  let sum = 0
  if (Array.isArray(props.formFields)) {
    props.formFields.forEach((field) => {
      if (field.type === 'number') {
        const value = parseFloat(formData.value[field.name]) || 0
        const multiplier = parseFloat(field.multiplier) || 1
        sum += value * multiplier
      }
    })
  }

  result.value = sum

  axios
    .post('/submit', {
      ...formData.value,
      calculated: result.value,
    })
    .then(() => alert('Sikeres beküldés!'))
    .catch(() => alert('Hiba a beküldés során.'))
}

function login() {
  axios
    .post('/login', loginForm.value)
    .then((res) => {
      if (res.data.role === 'admin') {
        authenticated.value = true
        showLogin.value = false
      } else {
        alert('Csak admin felhasználó léphet be.')
      }
    })
    .catch(() => alert('Hibás bejelentkezési adatok.'))
}

function logout() {
  authenticated.value = false
  showLogin.value = false
  loginForm.value.username = ''
  loginForm.value.password = ''
}
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <div v-if="showLogin && !authenticated">
          <h2 class="text-h5 mb-4">Admin bejelentkezés</h2>
          <v-form @submit.prevent="login">
            <v-text-field v-model="loginForm.username" label="Felhasználónév" required />
            <v-text-field v-model="loginForm.password" label="Jelszó" type="password" required />
            <v-btn type="submit" color="primary">Belépés</v-btn>
          </v-form>
        </div>

        <div v-else>
          <v-card class="pa-4 mb-4 text-center">
            <v-img
              v-if="header.image"
              :src="header.image"
              height="200"
              width="100%"
              class="mb-2 rounded"
              cover
            />
            <h2 class="text-h5 mb-2">{{ header.title }}</h2>
          </v-card>

          <v-form>
            <div v-for="(field, index) in enabledFields" :key="index" class="mb-4">
              <v-text-field
                v-if="field.type === 'text'"
                :label="field.label"
                v-model="formData[field.name]"
                :placeholder="field.placeholder || ''"
              />
              <v-text-field
                v-else-if="field.type === 'number'"
                type="number"
                :label="field.label + (field.multiplier ? ' (×' + field.multiplier + ')' : '')"
                v-model.number="formData[field.name]"
                :placeholder="field.placeholder || ''"
              />
              <v-select
                v-else-if="field.type === 'select'"
                :label="field.label"
                :items="getSelectItems(field)"
                item-title="text"
                item-value="value"
                v-model="formData[field.name]"
                :placeholder="field.placeholder || ''"
              />
              <v-row v-else-if="field.type === 'switch'" class="my-2">
                <v-col cols="12">
                  <v-switch
                    v-model="formData[field.name]"
                    :label="field.label"
                    color="primary"
                    inset
                  />
                </v-col>
              </v-row>
            </div>

            <v-btn color="primary" @click="calculateAndSubmit">Küldés</v-btn>
            <div v-if="result !== null" class="mt-4">
              Eredmény: <strong>{{ result }}</strong>
            </div>
          </v-form>

          <v-divider class="my-6"></v-divider>
          <footer class="text-caption text-center">{{ footer.text }}</footer>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>
