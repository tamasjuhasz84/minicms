<script setup>
import { ref, onMounted } from "vue";
import axios from "@/utils/axios";
import draggable from "vuedraggable";
import { v4 as uuidv4 } from "uuid";
import "./AdminEditor.scss";
import SubmissionList from "./SubmissionList.vue";

const errorMessage = ref("");
const successMessage = ref("");
const props = defineProps({ initialContent: Object });
const emit = defineEmits(["content-updated"]);
const tab = ref(0);
const expandedFields = ref(new Set());

const editableContent = ref({
  header: { title: "", image: "" },
  description: { text: "" },
  footer: { title: "", text: "" },
  form: [],
  styles: {
    color: "#1976d2",
    backgroundColor: "#f5f5f5",
    buttonFontSize: "16px",
    inputFontSize: "14px",
    labelFontSize: "13px",
    fontFamily: "Roboto, sans-serif",
    buttonLabel: "Küldés",
  },
});

const columnWidthOptions = [
  { label: "Teljes szélesség", value: 12 },
  { label: "Háromnegyed", value: 9 },
  { label: "Fél", value: 6 },
  { label: "Egyharmad", value: 4 },
  { label: "Negyed", value: 3 },
];

function toggleExpand(id) {
  expandedFields.value.has(id) ? expandedFields.value.delete(id) : expandedFields.value.add(id);
}

function isExpanded(id) {
  return expandedFields.value.has(id);
}

function generateName(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);
}

function isNameUnique(name, id) {
  const all = editableContent.value.form;
  return all.filter((f) => f.name === name && f.id !== id).length === 0;
}

function addField() {
  const id = uuidv4();
  editableContent.value.form.push({
    id,
    label: "",
    name: "",
    type: "text",
    enabled: true,
    required: false,
    columns: 12,
    description: "",
    validations: {
      min: null,
      max: null,
      step: null,
      pattern: "",
      maxFileSize: null,
    },
    sourceType: "cms",
    optionsText: "",
    source: "",
    sourceField: "",
    icon: "",
  });
}

function removeField(index) {
  const field = editableContent.value.form[index];
  if (field.name === "active") {
    errorMessage.value = 'A "Beküldhető" mező nem törölhető.';
    return;
  }
  editableContent.value.form.splice(index, 1);
}

function saveContent() {
  const nameSet = new Set();
  for (const field of editableContent.value.form) {
    if (!field.name || field.name.trim() === "") {
      errorMessage.value = `A(z) "${field.label || "névtelen"}" mezőhöz nincs megadva technikai név.`;
      return;
    }
    if (nameSet.has(field.name)) {
      errorMessage.value = `A(z) "${field.name}" név több mezőnél is szerepel. A technikai neveknek egyedinek kell lenniük.`;
      return;
    }
    nameSet.add(field.name);
  }

  const form = editableContent.value.form.map((f) => {
    const copy = { ...f };

    if (!copy.name && copy.label) {
      copy.name = generateName(copy.label);
    }

    copy.description = f.description || "";

    const optionBasedTypes = ["select", "checkbox-group", "radio"];

    if (optionBasedTypes.includes(copy.type)) {
      if (copy.sourceType === "cms") {
        try {
          copy.options = JSON.parse(copy.optionsText || "[]");
          copy.source = "";
        } catch (err) {
          errorMessage.value = `Hibás JSON az opcióknál: ${copy.label || copy.name}`;
          throw err;
        }
      } else if (copy.sourceType === "api") {
        copy.options = [];
        copy.source = copy.source || "";
      }
    }

    if (f.icon) {
      copy.icon = f.icon;
    }

    const isEmptyValidation = (v) =>
      !v || (typeof v === "object" && Object.values(v).every((val) => val === null || val === ""));

    if (isEmptyValidation(copy.validations)) {
      delete copy.validations;
    }

    return copy;
  });

  axios
    .post("/content?api_key=secret", {
      ...editableContent.value,
      form,
    })
    .then(() => {
      successMessage.value = "Sikeres mentés";
      setTimeout(() => (successMessage.value = ""), 4000);
      emit("content-updated", { ...editableContent.value, form });
    })
    .catch((err) => {
      console.error("Mentési hiba:", err);
      errorMessage.value = "Mentési hiba.";
    });
}

onMounted(() => {
  if (props.initialContent) {
    const content = JSON.parse(JSON.stringify(props.initialContent));

    if (!content.form.some((f) => f.name === "active")) {
      content.form.unshift({
        id: uuidv4(),
        label: "Beküldhető",
        name: "active",
        type: "switch",
        enabled: true,
        required: false,
        description: "", // új mező
      });
    }

    content.form = content.form.map((f) => {
      const field = {
        id: f.id || uuidv4(),
        label: f.label || "",
        name: f.name || generateName(f.label || ""),
        type: f.type || "text",
        enabled: typeof f.enabled === "undefined" ? true : f.enabled,
        required: f.required || false,
        columns: typeof f.columns === "number" ? f.columns : 12,
        description: f.description || "",
        validations: {
          min: f.validations?.min ?? null,
          max: f.validations?.max ?? null,
          step: f.validations?.step ?? null,
          pattern: f.validations?.pattern || "",
          maxFileSize: f.validations?.maxFileSize ?? null,
        },
        sourceType: f.sourceType || "",
        optionsText: Array.isArray(f.options)
          ? JSON.stringify(f.options, null, 2)
          : f.optionsText || "",
        source: f.source || "",
        sourceField: f.sourceField || "",
        icon: f.icon || "",
      };

      if (f.type === "select") {
        if (f.source && typeof f.source === "string" && f.source.trim() !== "") {
          field.sourceType = "api";
          field.optionsText = "";
        } else if (Array.isArray(f.options)) {
          field.sourceType = "cms";
          field.optionsText = JSON.stringify(f.options, null, 2);
        } else {
          field.sourceType = "cms";
          field.optionsText = "[]";
        }
      }

      return field;
    });

    editableContent.value = {
      header: content.header || { title: "", image: "" },
      footer: content.footer || { title: "", text: "" },
      description: content.description || { text: "" },
      form: content.form,
      styles: content.styles || editableContent.value.styles,
    };
  }
});
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
          <!-- Header -->
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Fejléc</h3>
            <v-text-field label="Cím" v-model="editableContent.header.title" />
            <v-text-field label="Kép URL" v-model="editableContent.header.image" />
          </v-card>

          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Bevezető leírás</h3>
            <v-textarea
              v-model="editableContent.description.text"
              label="Leírás szöveg"
              auto-grow
            />
          </v-card>

          <!-- Footer -->
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Lábléc</h3>
            <v-text-field label="Cím" v-model="editableContent.footer.title" />
            <v-text-field label="Szöveg" v-model="editableContent.footer.text" />
          </v-card>

          <!-- Styles -->
          <v-card class="pa-4 mb-6">
            <h3 class="text-subtitle-1 mb-2">Stílusok</h3>
            <v-text-field label="Label méret" v-model="editableContent.styles.labelFontSize" />
            <v-text-field label="Tartalom méret" v-model="editableContent.styles.inputFontSize" />
            <v-text-field label="Betűtípus" v-model="editableContent.styles.fontFamily" />
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
              label="Gomb szövegméret"
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
                mode="hex"
                :modes="['hex']"
                class="compact-color"
              />
            </div>
          </v-card>

          <!-- Form fields -->
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
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div
                      @click="toggleExpand(field.id)"
                      class="cursor-pointer flex-grow-1 d-flex align-center"
                    >
                      <v-icon
                        :icon="isExpanded(field.id) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                        size="18"
                        class="mr-2"
                      />
                      <strong>{{ field.label || "Új mező" }}</strong>
                      <span class="text-caption ml-2">({{ field.type }})</span>
                    </div>
                    <span class="drag-icon">☰</span>
                  </div>

                  <v-expand-transition>
                    <div v-show="isExpanded(field.id)">
                      <v-text-field label="Címke" v-model="field.label" class="mb-2" />
                      <v-textarea
                        label="Leírás / kérdés szöveg"
                        v-model="field.description"
                        auto-grow
                        class="mb-2"
                      />
                      <v-text-field
                        label="Technikai név (name)"
                        v-model="field.name"
                        :rules="[
                          (v) => !!v || 'A mezőnév nem lehet üres.',
                          (v) => isNameUnique(v, field.id) || 'A mezőnévnek egyedinek kell lennie.',
                        ]"
                        class="mb-2"
                        hint="Ez a név fog megjelenni a beküldött JSON kulcsaként."
                        persistent-hint
                      />
                      <v-select
                        :items="[
                          'text',
                          'number',
                          'select',
                          'switch',
                          'file',
                          'checkbox',
                          'checkbox-group',
                          'radio',
                          'slider',
                          'range',
                          'rating',
                          'textarea',
                          'email',
                          'tel',
                          'date',
                          'time',
                          'divider',
                        ]"
                        label="Típus"
                        v-model="field.type"
                        class="mb-2"
                      />
                      <v-switch v-model="field.enabled" label="Engedélyezve" class="mb-2" />
                      <v-switch v-model="field.required" label="Kötelező" class="mb-2" />
                      <v-select
                        :items="columnWidthOptions"
                        item-title="label"
                        item-value="value"
                        label="Mező szélessége"
                        v-model="field.columns"
                        class="mb-2"
                      />

                      <!-- Típus-specifikus mezők -->
                      <v-text-field
                        v-if="['text', 'number'].includes(field.type)"
                        label="Minimum"
                        v-model.number="field.validations.min"
                        type="number"
                        class="mb-2"
                      />
                      <v-text-field
                        v-if="['checkbox', 'radio'].includes(field.type)"
                        label="Mező neve (kulcs)"
                        v-model="field.name"
                        class="mb-2"
                      />
                      <v-text-field
                        v-if="['text', 'number'].includes(field.type)"
                        label="Maximum"
                        v-model.number="field.validations.max"
                        type="number"
                        class="mb-2"
                      />

                      <v-text-field
                        v-if="field.type === 'text'"
                        label="Regex minta"
                        v-model="field.validations.pattern"
                        class="mb-2"
                      />

                      <v-text-field
                        v-if="field.type === 'file'"
                        label="Max fájlméret (MB)"
                        v-model.number="field.validations.maxFileSize"
                        type="number"
                        class="mb-2"
                      />

                      <v-text-field
                        v-if="['slider', 'range'].includes(field.type)"
                        label="Minimum érték"
                        v-model.number="field.validations.min"
                        type="number"
                        class="mb-2"
                      />
                      <v-text-field
                        v-if="['slider', 'range'].includes(field.type)"
                        label="Maximum érték"
                        v-model.number="field.validations.max"
                        type="number"
                        class="mb-2"
                      />
                      <v-text-field
                        v-if="['slider', 'range'].includes(field.type)"
                        label="Lépésköz (step)"
                        v-model.number="field.validations.step"
                        type="number"
                        class="mb-2"
                      />
                      <v-text-field
                        v-if="field.type === 'rating'"
                        label="Ikon neve (pl. mdi-star)"
                        v-model="field.icon"
                        class="mb-2"
                      />

                      <!-- Opció alapú mezők -->
                      <template v-if="['checkbox-group', 'radio', 'select'].includes(field.type)">
                        <v-select
                          label="Forrás típusa"
                          :items="['cms', 'api']"
                          v-model="field.sourceType"
                          class="mb-2"
                        />
                        <v-textarea
                          v-if="field.sourceType === 'cms'"
                          label="Opcók JSON"
                          v-model="field.optionsText"
                          auto-grow
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
                        >Törlés</v-btn
                      >
                    </div>
                  </v-expand-transition>
                </v-card>
              </template>
            </draggable>
          </v-card>

          <v-btn type="submit" color="primary">Mentés</v-btn>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mt-4"
            border="start"
            @click="errorMessage = ''"
            >{{ errorMessage }}</v-alert
          >
          <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mt-4"
            border="start"
            @click="successMessage = ''"
            >{{ successMessage }}</v-alert
          >
        </v-form>
      </v-window-item>

      <v-window-item :value="1">
        <SubmissionList />
      </v-window-item>
    </v-window>
  </v-container>
</template>
