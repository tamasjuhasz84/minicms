<script setup>
import { computed } from "vue";
import FormFieldRenderer from "./FormFieldRenderer.vue";

const emit = defineEmits(["update:modelValue"]);

const { section, modelValue, getRules, getItems, errorMessages } = defineProps({
  section: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Object,
    required: true,
  },
  getRules: {
    type: Function,
    required: true,
  },
  getItems: {
    type: Function,
    default: () => () => [],
  },
  errorMessages: {
    type: Object,
    default: () => ({}),
  },
});

const fields = computed(() => section.fields || []);
</script>

<template>
  <v-row dense>
    <v-col v-for="field in fields" :key="field.uuid" :cols="field.columns || 12">
      <FormFieldRenderer
        :field="field"
        :model-value="modelValue[field.name]"
        @update:modelValue="
          (val) => emit('update:modelValue', { ...modelValue, [field.name]: val })
        "
        :rules="getRules(field)"
        :items="getItems(field)"
        :error-messages="errorMessages[field.name] || []"
      />
    </v-col>
  </v-row>
</template>
