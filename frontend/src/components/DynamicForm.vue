<script setup>
import FormSection from "@/components/form/FormSection.vue";
import { ref, computed, watch, onMounted } from "vue";
import { v4 as uuidv4 } from "uuid";
import { setupFormLogic } from "@/composables/useFormLogic";
import axios from "@/utils/axios";
import "./DynamicForm.scss";

const props = defineProps({
  formFields: {
    type: Array,
    required: true,
  },
});

const successMessage = ref("");
const formRef = ref(null);
const formData = ref({});
const selectOptions = ref({});
const header = ref({});
const footer = ref({});
const description = ref({ text: "" });
const styles = ref({
  color: "#1976d2",
  fontSize: "16px",
  buttonLabel: "Küldés",
});
const showLogin = ref(false);
const authenticated = ref(false);
const loginForm = ref({ username: "", password: "" });
const errorMessages = ref({});

const fieldMap = ref([]);
const enabledFields = computed(() => fieldMap.value);

const sectionedFields = computed(() => {
  const groups = {};
  enabledFields.value.forEach((field) => {
    const section = field.section || "Alapértelmezett";
    if (!groups[section]) groups[section] = [];
    groups[section].push(field);
  });
  return groups;
});

const { initFormData, loadSelects, getSelectItems, getValidationRules, submitForm } =
  setupFormLogic(enabledFields, formData, formRef, selectOptions, errorMessages, successMessage);

watch(
  () => props.formFields,
  () => {
    fieldMap.value = props.formFields
      .filter((f) => f.enabled !== false)
      .map((f) => ({ ...f, uuid: uuidv4(), columns: f.columns || 1 }));
    initFormData();
    loadSelects();
  },
  { immediate: true },
);

onMounted(() => {
  axios.get("/content").then((res) => {
    header.value = res.data.header || {};
    footer.value = res.data.footer || {};
    description.value = res.data.description || {};
    const incoming = res.data.styles || styles.value;
    styles.value = {
      ...incoming,
      inputBackground: incoming.color || "#ffffff",
    };
  });
});
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

          <v-card v-if="description.text" class="pa-4 mb-4">
            <div class="text-body-1" style="white-space: pre-line">
              {{ description.text }}
            </div>
          </v-card>

          <v-form ref="formRef">
            <FormSection
              v-for="(fields, title) in sectionedFields"
              :key="title"
              :section="{ name: title, fields }"
              v-model="formData"
              :get-rules="getValidationRules"
              :get-items="getSelectItems"
            />

            <v-btn :color="styles.color" @click="submitForm">{{ styles.buttonLabel }}</v-btn>

            <v-expand-transition>
              <v-alert
                v-if="errorMessages.length"
                type="error"
                class="mt-4"
                border="start"
                variant="tonal"
              >
                <div v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</div>
              </v-alert>
            </v-expand-transition>

            <v-expand-transition>
              <v-alert
                v-if="successMessage"
                type="success"
                class="mt-4"
                border="start"
                variant="tonal"
              >
                {{ successMessage }}
              </v-alert>
            </v-expand-transition>
          </v-form>

          <v-divider class="my-6"></v-divider>
          <v-footer class="text-center d-flex flex-column ga-2 py-4" color="indigo-lighten-1">
            <div v-if="footer.title" class="text-h6 font-weight-medium opacity-90 px-4">
              {{ footer.title }}
            </div>
            <v-divider class="my-2" thickness="2" width="50"></v-divider>
            <div v-if="footer.text" class="text-caption font-weight-regular opacity-60 px-4">
              {{ footer.text }}
            </div>
          </v-footer>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>
