<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import draggable from 'vuedraggable'
import './AdminEditor.scss'
import SubmissionList from './SubmissionList.vue'

const props = defineProps({
  initialContent: Object,
})

const emit = defineEmits(['content-updated'])

const tab = ref(0)

const editableContent = ref({
  header: { title: '', image: '' },
  footer: { text: '' },
  form: [],
})

function addField() {
  editableContent.value.form.push({
    label: '',
    name: '',
    type: 'text',
    placeholder: '',
    enabled: true,
    sourceType: 'cms',
    optionsText: '',
    optionsKey: '',
    source: '',
    sourceField: '',
  })
}

function removeField(index) {
  const field = editableContent.value.form[index]
  if (field.name === 'active') {
    alert('A "Beküldhető" mező nem törölhető.')
    return
  }
  editableContent.value.form.splice(index, 1)
}

function saveContent() {
  const form = editableContent.value.form.map((f) => {
    const copy = { ...f }

    if (f.type === 'select') {
      if (f.sourceType === 'cms') {
        try {
          const parsed = JSON.parse(f.optionsText)
          copy.options = f.optionsKey ? { [f.optionsKey]: parsed } : parsed
        } catch (e) {
          alert('Hibás JSON az opcióknál')
          throw e
        }
        delete copy.source
        delete copy.sourceField
      } else if (f.sourceType === 'api') {
        copy.source = f.source
        copy.sourceField = f.sourceField
        delete copy.options
      }
    }

    delete copy.optionsText
    delete copy.sourceType
    delete copy.optionsKey
    return copy
  })

  const payload = {
    header: editableContent.value.header,
    footer: editableContent.value.footer,
    form,
  }

  axios
    .post('/content?api_key=secret', payload)
    .then(() => {
      alert('Mentés sikeres!')
      emit('content-updated', payload)
    })
    .catch(() => alert('Mentés sikertelen!'))
}

onMounted(() => {
  if (props.initialContent) {
    const content = JSON.parse(JSON.stringify(props.initialContent))

    if (!content.form.some((f) => f.name === 'active')) {
      content.form.unshift({
        label: 'Beküldhető',
        name: 'active',
        type: 'switch',
        enabled: true,
      })
    }

    content.form = content.form.map((f) => {
      const field = {
        label: f.label || '',
        name: f.name || '',
        type: f.type || 'text',
        placeholder: f.placeholder || '',
        enabled: typeof f.enabled === 'undefined' ? true : f.enabled,
        optionsText: '',
        optionsKey: f.optionsKey || '',
        sourceType: '',
        source: f.source || '',
        sourceField: f.sourceField || '',
      }

      if (f.type === 'select') {
        if (Array.isArray(f.options)) {
          field.optionsText = JSON.stringify(f.options, null, 2)
          field.sourceType = 'cms'
        } else if (typeof f.options === 'object' && f.options !== null) {
          const key = Object.keys(f.options).find((k) => Array.isArray(f.options[k]))
          const array = key ? f.options[key] : []
          field.optionsKey = key || ''
          field.optionsText = JSON.stringify(array, null, 2)
          field.sourceType = 'cms'
        } else if (f.source) {
          field.sourceType = 'api'
        }
      }

      return field
    })

    editableContent.value = {
      header: content.header || { title: '', image: '' },
      footer: content.footer || { text: '' },
      form: content.form,
    }
  }
})
</script>

<template>
  <v-container>
    <v-tabs v-model="tab" bg-color="primary" dark>
      <v-tab :value="0">Tartalom</v-tab>
      <v-tab :value="1">Beküldések</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- TAB 0: Tartalomszerkesztés -->
      <v-window-item :value="0">
        <v-form @submit.prevent="saveContent">
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Fejléc</h3>
            <v-text-field label="Cím" v-model="editableContent.header.title" />
            <v-text-field label="Kép URL" v-model="editableContent.header.image" />
          </v-card>

          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Lábléc</h3>
            <v-text-field label="Szöveg" v-model="editableContent.footer.text" />
          </v-card>

          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-4">Űrlap mezők</h3>
            <v-btn color="success" class="mb-4" @click="addField">Új mező hozzáadása</v-btn>

            <draggable
              v-model="editableContent.form"
              item-key="name"
              animation="250"
              class="form-draggable"
              :options="{
                scroll: true,
                scrollSensitivity: 60,
                scrollSpeed: 10,
                ghostClass: 'ghost',
                chosenClass: 'chosen',
              }"
            >
              <template #item="{ element: field, index: i }">
                <v-card class="pa-4 mb-4 draggable-card">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <strong>{{ field.label || 'Új mező' }}</strong>
                    <span class="drag-icon">☰</span>
                  </div>

                  <v-text-field label="Címke" v-model="field.label" class="mb-2" />
                  <v-select
                    label="Típus"
                    :items="['text', 'number', 'select', 'switch']"
                    v-model="field.type"
                    class="mb-2"
                  />
                  <v-text-field label="Név" v-model="field.name" class="mb-2" />
                  <v-text-field label="Placeholder" v-model="field.placeholder" class="mb-2" />
                  <v-switch v-model="field.enabled" label="Engedélyezve" class="mb-2" />

                  <template v-if="field.type === 'select'">
                    <v-select
                      label="Forrás típusa"
                      :items="['cms', 'api']"
                      v-model="field.sourceType"
                      class="mb-2"
                    />
                    <v-textarea
                      v-if="field.sourceType === 'cms'"
                      label="Opciók JSON"
                      v-model="field.optionsText"
                      hint="[{ value: 'a', text: 'A' }]"
                      persistent-hint
                      auto-grow
                      class="mb-2"
                    />
                    <v-text-field
                      v-if="field.sourceType === 'cms'"
                      label="CMS kulcs"
                      v-model="field.optionsKey"
                      class="mb-2"
                    />
                    <v-text-field
                      v-if="field.sourceType === 'api'"
                      label="API URL"
                      v-model="field.source"
                      class="mb-2"
                    />
                    <v-text-field
                      v-if="field.sourceType === 'api'"
                      label="API kulcs"
                      v-model="field.sourceField"
                      class="mb-2"
                    />
                  </template>

                  <v-btn
                    v-if="field.name !== 'active'"
                    color="error"
                    @click="removeField(i)"
                    size="small"
                    class="mt-2"
                  >
                    Törlés
                  </v-btn>
                </v-card>
              </template>
            </draggable>
          </v-card>

          <v-btn type="submit" color="primary">Mentés</v-btn>
        </v-form>
      </v-window-item>

      <!-- TAB 1: Beküldött űrlapok -->
      <v-window-item :value="1">
        <SubmissionList />
      </v-window-item>
    </v-window>
  </v-container>
</template>
