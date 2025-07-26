<script setup>
const props = defineProps({
  field: { type: Object, required: true },
  modelValue: [String, Number, Boolean, File, Array],
  rules: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  errorMessages: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue"]);

function onCheckboxGroupChange(checked, value) {
  let current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  if (checked) {
    if (!current.includes(value)) current.push(value);
  } else {
    current = current.filter((v) => v !== value);
  }
  emit("update:modelValue", current);
}
</script>

<template>
  <div class="form-field-renderer">
    <!-- Leírás / kérdés szöveg megjelenítése -->
    <div v-if="field.description" class="field-description mb-1 text-body-2">
      {{ field.description }}
    </div>

    <!-- Text / Email / Tel -->
    <v-text-field
      v-if="['text', 'email', 'tel'].includes(field.type)"
      :type="field.type"
      :label="field.label"
      :model-value="modelValue"
      :rules="rules"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Number -->
    <v-text-field
      v-else-if="field.type === 'number'"
      type="number"
      :label="field.label"
      :model-value="modelValue"
      :rules="rules"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Textarea -->
    <v-textarea
      v-else-if="field.type === 'textarea'"
      :label="field.label"
      :model-value="modelValue"
      :rules="rules"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      auto-grow
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Select -->
    <v-select
      v-else-if="field.type === 'select'"
      :label="field.label"
      :items="items"
      item-title="text"
      item-value="value"
      :model-value="modelValue"
      :rules="rules"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Radio -->
    <v-radio-group
      v-else-if="field.type === 'radio'"
      :label="field.label"
      :model-value="modelValue"
      :rules="rules"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    >
      <v-radio
        v-for="option in items"
        :key="option.value"
        :label="option.text"
        :value="option.value"
      />
    </v-radio-group>

    <!-- Checkbox group -->
    <v-row v-else-if="field.type === 'checkbox-group'" dense>
      <v-col cols="12" v-for="option in items" :key="option.value">
        <v-checkbox
          :label="option.text"
          :value="option.value"
          :model-value="modelValue"
          :error="!!errorMessages?.length"
          :error-messages="errorMessages"
          validate-on="input"
          multiple
          @change="onCheckboxGroupChange($event, option.value)"
        />
      </v-col>
    </v-row>

    <!-- Slider -->
    <v-slider
      v-else-if="field.type === 'slider'"
      :label="field.label"
      :min="field.validations?.min ?? 0"
      :max="field.validations?.max ?? 100"
      :step="field.validations?.step ?? 1"
      :model-value="modelValue"
      :rules="rules"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
      thumb-label
    />

    <!-- Range Slider -->
    <v-range-slider
      v-else-if="field.type === 'range'"
      :label="field.label"
      :min="field.validations?.min ?? 0"
      :max="field.validations?.max ?? 100"
      :step="field.validations?.step ?? 1"
      :model-value="modelValue"
      :rules="rules"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
      thumb-label
    />

    <!-- Rating -->
    <v-rating
      v-else-if="field.type === 'rating'"
      :length="field.validations?.max ?? 5"
      :item-icon="field.icon || 'mdi-star'"
      :model-value="modelValue"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Date -->
    <v-text-field
      v-else-if="field.type === 'date'"
      type="date"
      :label="field.label"
      :model-value="modelValue"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Time -->
    <v-text-field
      v-else-if="field.type === 'time'"
      type="time"
      :label="field.label"
      :model-value="modelValue"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Switch -->
    <v-row v-else-if="field.type === 'switch'" class="my-2">
      <v-col cols="12">
        <v-switch
          :label="field.label"
          color="primary"
          inset
          :model-value="modelValue"
          :error="!!errorMessages?.length"
          :error-messages="errorMessages"
          validate-on="input"
          @update:modelValue="emit('update:modelValue', $event)"
        />
      </v-col>
    </v-row>

    <!-- Checkbox -->
    <v-checkbox
      v-else-if="field.type === 'checkbox'"
      :label="field.label"
      :model-value="modelValue"
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- File -->
    <v-file-input
      v-else-if="field.type === 'file'"
      :label="field.label"
      :model-value="modelValue"
      show-size
      :error="!!errorMessages?.length"
      :error-messages="errorMessages"
      validate-on="input"
      @update:modelValue="emit('update:modelValue', $event)"
    />

    <!-- Divider -->
    <v-divider v-else-if="field.type === 'divider'" class="my-4" />
  </div>
</template>
