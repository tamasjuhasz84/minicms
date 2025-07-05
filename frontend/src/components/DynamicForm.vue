<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from '@/utils/axios'
import { v4 as uuidv4 } from 'uuid'
import './DynamicForm.scss'

const props = defineProps({
  formFields: {
    type: Array,
    required: true,
  },
})

const formRef = ref(null)
const formData = ref({})
const selectOptions = ref({})
const header = ref({})
const footer = ref({})
const styles = ref({
  color: '#1976d2',
  fontSize: '16px',
  buttonLabel: 'Küldés',
})
const showLogin = ref(false)
const authenticated = ref(false)
const loginForm = ref({ username: '', password: '' })
const errorMessages = ref([])
const fieldMap = ref([])

const enabledFields = computed(() => {
  if (!Array.isArray(props.formFields)) return []

  fieldMap.value = props.formFields
    .filter((f) => f.enabled !== false)
    .map((field) => ({ ...field, uuid: uuidv4() }))

  return fieldMap.value
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
    const incoming = res.data.styles || styles.value
    styles.value = {
      ...incoming,
      inputBackground: incoming.color || '#ffffff',
    }
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

function getValidationRules(field) {
  const rules = []

  if (field.required) {
    rules.push((v) => (v !== null && v !== '') || 'Kötelező mező')
  }

  if (field.type === 'number') {
    if (field.validations?.min !== null) {
      rules.push((v) => v >= field.validations.min || `Minimum érték: ${field.validations.min}`)
    }
    if (field.validations?.max !== null) {
      rules.push((v) => v <= field.validations.max || `Maximum érték: ${field.validations.max}`)
    }
  }

  if (field.type === 'text' && field.validations?.pattern) {
    try {
      const regex = new RegExp(field.validations.pattern)
      rules.push((v) => regex.test(v) || 'Hibás formátum')
    } catch (e) {
      console.warn('Hibás regex minta:', field.validations.pattern)
    }
  }

  return rules
}

async function submitForm() {
  errorMessages.value = []

  const result = await formRef.value?.validate()
  if (!result?.valid) {
    errorMessages.value.push('Kérjük, javítsd a hibás mezőket.')
    return
  }

  if (!formData.value.active) {
    errorMessages.value.push(
      'A beküldés csak akkor engedélyezett, ha a "Beküldhető" mező be van kapcsolva.',
    )
    return
  }

  axios
    .post('/submit', { ...formData.value })
    .then(() => alert('Sikeres beküldés!'))
    .catch(() => alert('Hiba a beküldés során.'))
}

function login() {
  axios
    .post('/login', loginForm.value)
    .then((res) => {
      const token = res.data.token
      if (token) {
        localStorage.setItem('jwt', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
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
  localStorage.removeItem('jwt')
  delete axios.defaults.headers.common['Authorization']
}
</script>

<template>
  <v-app
    class="dynamic-form"
    :style="{
      '--form-color': styles.color,
      '--form-bg': styles.backgroundColor,
      '--form-label-font': styles.labelFontSize,
      '--form-input-font': styles.inputFontSize,
      '--form-button-font': styles.buttonFontSize,
      '--form-font-family': styles.fontFamily,
      '--form-footer-color': '#000',
    }"
  >
    <v-main>
      <v-container>
        <div v-if="showLogin && !authenticated" class="login-box">
          <h2 class="text-h5 mb-4">Admin bejelentkezés</h2>
          <v-form @submit.prevent="login">
            <v-text-field v-model="loginForm.username" label="Felhasználónév" required />
            <v-text-field v-model="loginForm.password" label="Jelszó" type="password" required />
            <v-btn type="submit" color="primary">Belépés</v-btn>
          </v-form>
        </div>

        <div v-else>
          <v-card class="pa-4 mb-4 header-card">
            <v-img
              v-if="header.image"
              :src="header.image"
              height="200"
              width="100%"
              class="mb-2"
              cover
            />
            <h2 class="text-h5 mb-2">{{ header.title }}</h2>
          </v-card>

          <v-form ref="formRef">
            <div
              v-for="field in enabledFields"
              :key="field.uuid"
              class="form-field"
              :style="{ fontSize: styles.fontSize }"
            >
              <v-text-field
                v-if="field.type === 'text'"
                :label="field.label"
                v-model="formData[field.name]"
                :placeholder="field.placeholder || ''"
                :rules="getValidationRules(field)"
              />
              <v-text-field
                v-else-if="field.type === 'number'"
                type="number"
                :label="field.label"
                v-model.number="formData[field.name]"
                :placeholder="field.placeholder || ''"
                :rules="getValidationRules(field)"
              />
              <v-select
                v-else-if="field.type === 'select'"
                :label="field.label"
                :items="getSelectItems(field)"
                item-title="text"
                item-value="value"
                v-model="formData[field.name]"
                :placeholder="field.placeholder || ''"
                :rules="getValidationRules(field)"
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

            <v-btn :color="styles.color" @click="submitForm">{{ styles.buttonLabel }}</v-btn>

            <v-alert
              v-if="errorMessages.length"
              type="error"
              class="mt-4"
              border="start"
              variant="tonal"
            >
              <div v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</div>
            </v-alert>
          </v-form>

          <v-divider class="my-6"></v-divider>
          <footer class="text-caption text-center">{{ footer.text }}</footer>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>
