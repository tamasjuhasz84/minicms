<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import draggable from 'vuedraggable'
import { v4 as uuidv4 } from 'uuid'
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
  styles: {
    color: '#1976d2',
    backgroundColor: '#f5f5f5',
    buttonFontSize: '16px',
    inputFontSize: '14px',
    labelFontSize: '13px',
    fontFamily: 'Roboto, sans-serif',
    buttonLabel: 'Küldés',
  },
})

function addField() {
  editableContent.value.form.push({
    id: uuidv4(),
    label: '',
    name: '',
    type: 'text',
    placeholder: '',
    enabled: true,
    required: false,
    group: '',
    validations: {
      min: null,
      max: null,
      pattern: '',
      maxFileSize: null,
    },
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
    styles: editableContent.value.styles,
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
        id: uuidv4(),
        label: 'Beküldhető',
        name: 'active',
        type: 'switch',
        enabled: true,
        required: false,
      })
    }

    content.form = content.form.map((f) => {
      const field = {
        id: f.id || uuidv4(),
        label: f.label || '',
        name: f.name || '',
        type: f.type || 'text',
        placeholder: f.placeholder || '',
        enabled: typeof f.enabled === 'undefined' ? true : f.enabled,
        required: f.required || false,
        group: f.group || '',
        validations: f.validations || {
          min: null,
          max: null,
          pattern: '',
          maxFileSize: null,
        },
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
      styles: content.styles || {
        color: '#1976d2',
        backgroundColor: '#f5f5f5',
        buttonFontSize: '16px',
        inputFontSize: '14px',
        labelFontSize: '13px',
        fontFamily: 'Roboto, sans-serif',
        buttonLabel: 'Küldés',
      },
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
      <v-window-item :value="0">
        <v-form @submit.prevent="saveContent">
          <!-- Fejléc -->
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Fejléc</h3>
            <v-text-field label="Cím" v-model="editableContent.header.title" />
            <v-text-field label="Kép URL" v-model="editableContent.header.image" />
          </v-card>

          <!-- Lábléc -->
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Lábléc</h3>
            <v-text-field label="Szöveg" v-model="editableContent.footer.text" />
          </v-card>

          <!-- Stílusok -->
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Stílusok</h3>
            <v-text-field
              label="Label méret (pl. 13px)"
              v-model="editableContent.styles.labelFontSize"
            />
            <v-text-field
              label="Tartalom méret (pl. 14px)"
              v-model="editableContent.styles.inputFontSize"
            />
            <v-text-field
              label="Betűtípus (pl. Roboto, Arial)"
              v-model="editableContent.styles.fontFamily"
            />
            <div class="mb-2">
              <div class="text-caption font-weight-medium mb-1">Mező háttérszíne</div>
              <v-color-picker
                v-model="editableContent.styles.backgroundColor"
                flat
                hide-inputs
                hide-canvas
                mode="rgb"
                :modes="['rgb']"
                class="compact-color"
              />
            </div>
            <v-text-field
              label="Gomb szövegméret (pl. 16px)"
              v-model="editableContent.styles.buttonFontSize"
            />
            <v-text-field label="Gomb felirat" v-model="editableContent.styles.buttonLabel" />
            <div class="mb-2">
              <div class="text-caption font-weight-medium mb-1">Gomb színe</div>
              <v-color-picker
                v-model="editableContent.styles.color"
                flat
                hide-inputs
                hide-canvas
                mode="rgb"
                :modes="['rgb']"
                class="compact-color"
              />
            </div>
          </v-card>

          <!-- Mezők -->
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-4">Űrlap mezők</h3>
            <v-btn color="success" class="mb-4" @click="addField">Új mező hozzáadása</v-btn>

            <draggable
              v-model="editableContent.form"
              item-key="id"
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

                  <v-text-field
                    label="Címke"
                    v-model="field.label"
                    class="mb-2"
                    hint="Mező feliratként jelenik meg."
                    persistent-hint
                  />

                  <v-select
                    :items="['text', 'number', 'select', 'switch', 'file']"
                    label="Típus"
                    v-model="field.type"
                    class="mb-2"
                    hint="A mező típusa (pl. szöveg, szám, választólista, stb.)"
                    persistent-hint
                  />

                  <v-text-field
                    label="Név"
                    v-model="field.name"
                    class="mb-2"
                    hint="Belső azonosító. Csak betű, szám, kötőjel és aláhúzás használható."
                    persistent-hint
                  />

                  <v-text-field
                    label="Placeholder"
                    v-model="field.placeholder"
                    class="mb-2"
                    hint="A mezőben megjelenő segítő szöveg."
                    persistent-hint
                  />

                  <v-text-field
                    label="Szekció neve"
                    v-model="field.group"
                    class="mb-2"
                    hint="Egy szöveges szekciónév (pl. 'Kapcsolat')."
                    persistent-hint
                  />

                  <v-switch v-model="field.enabled" label="Engedélyezve" class="mb-2" />
                  <v-switch v-model="field.required" label="Kötelező" class="mb-2" />

                  <template v-if="['text', 'number'].includes(field.type)">
                    <v-text-field
                      label="Minimum"
                      v-model.number="field.validations.min"
                      type="number"
                      hint="Legkisebb elfogadható érték (csak számnál)"
                      persistent-hint
                    />
                    <v-text-field
                      label="Maximum"
                      v-model.number="field.validations.max"
                      type="number"
                      hint="Legnagyobb elfogadható érték (csak számnál)"
                      persistent-hint
                    />
                  </template>

                  <v-text-field
                    v-if="field.type === 'text'"
                    label="Regex minta"
                    v-model="field.validations.pattern"
                    hint="Pl. ^[A-Za-z0-9]+$ (csak betűk és számok)"
                    persistent-hint
                  >
                    <template #append>
                      <v-tooltip text="Szabályos kifejezés, aminek meg kell felelnie a szövegnek.">
                        <template #activator="{ props }">
                          <v-icon v-bind="props" icon="mdi-help-circle" size="small" />
                        </template>
                      </v-tooltip>
                    </template>
                  </v-text-field>

                  <v-text-field
                    v-if="field.type === 'file'"
                    label="Max fájlméret (MB)"
                    v-model.number="field.validations.maxFileSize"
                    type="number"
                    hint="Csak fájlmező esetén értelmezett."
                    persistent-hint
                  />

                  <template v-if="field.type === 'select'">
                    <v-select
                      label="Forrás típusa"
                      :items="['cms', 'api']"
                      v-model="field.sourceType"
                      class="mb-2"
                      hint="Az opciók forrása (saját CMS vagy API)"
                      persistent-hint
                    />

                    <v-textarea
                      v-if="field.sourceType === 'cms'"
                      label="Opcók JSON"
                      v-model="field.optionsText"
                      hint="Pl. [{ value: 'a', text: 'A' }]"
                      persistent-hint
                      auto-grow
                      class="mb-2"
                    />

                    <v-text-field
                      v-if="field.sourceType === 'cms'"
                      label="CMS kulcs"
                      v-model="field.optionsKey"
                      class="mb-2"
                      hint="Az objektum kulcs, ahol az opciók tömbje van (pl. 'options')"
                      persistent-hint
                    >
                      <template #append>
                        <v-tooltip
                          text="Ha az opciók JSON-ben egy kulcs alatt találhatók, pl. { 'options': [...] }, írd be: options"
                        >
                          <template #activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-help-circle" size="small" />
                          </template>
                        </v-tooltip>
                      </template>
                    </v-text-field>

                    <v-text-field
                      v-if="field.sourceType === 'api'"
                      label="API URL"
                      v-model="field.source"
                      class="mb-2"
                      hint="Például: /api/options"
                      persistent-hint
                    />

                    <v-text-field
                      v-if="field.sourceType === 'api'"
                      label="API kulcs"
                      v-model="field.sourceField"
                      class="mb-2"
                      hint="Az a kulcs a válaszban, ami alatt a tömb van (pl. 'data')"
                      persistent-hint
                    >
                      <template #append>
                        <v-tooltip
                          text="Az API válasz JSON objektumában található kulcs neve, ahol a tömb található."
                        >
                          <template #activator="{ props }">
                            <v-icon v-bind="props" icon="mdi-help-circle" size="small" />
                          </template>
                        </v-tooltip>
                      </template>
                    </v-text-field>
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

      <v-window-item :value="1">
        <SubmissionList />
      </v-window-item>
    </v-window>
  </v-container>
</template>
