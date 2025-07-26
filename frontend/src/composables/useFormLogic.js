import axios from "@/utils/axios";

export function setupFormLogic(
  formFields,
  formData,
  formRef,
  selectOptions,
  errorMessages,
  successMessage,
) {
  function initFormData() {
    formData.value = {};
    formFields.value.forEach((field) => {
      switch (field.type) {
        case "switch":
        case "checkbox":
          formData.value[field.name] = false;
          break;
        case "checkbox-group":
          formData.value[field.name] = [];
          break;
        default:
          formData.value[field.name] = field.type === "file" ? null : "";
      }
    });
  }

  function loadSelects() {
    const typesWithOptions = ["select", "radio", "checkbox-group"];

    const apiFields = formFields.value.filter((f) => typesWithOptions.includes(f.type) && f.source);

    apiFields.forEach((field) => {
      axios
        .get(field.source)
        .then((res) => {
          let rawData = res.data;

          if (!Array.isArray(rawData)) {
            const arrayInObject = Object.values(rawData).find((v) => Array.isArray(v));
            rawData = arrayInObject || [];
          }

          const key = field.sourceField || "text";

          const options = rawData.map((item) => {
            const text = String(item?.[key] ?? "");
            return {
              text,
              value: text, // <-- CSAK a szöveg legyen a value is
            };
          });

          selectOptions.value[field.name] = options;
        })
        .catch((err) => {
          console.error(`Hiba a(z) ${field.source} betöltésekor`, err);
        });
    });

    const cmsFields = formFields.value.filter(
      (f) => typesWithOptions.includes(f.type) && f.optionsText,
    );

    cmsFields.forEach((field) => {
      try {
        const parsedOptions = JSON.parse(field.optionsText || "[]");
        if (Array.isArray(parsedOptions)) {
          const options = parsedOptions.map((opt) => {
            const text = String(opt?.text ?? opt ?? "");
            return {
              text,
              value: text, // <-- CMS-nél is CSAK a szöveg
            };
          });
          selectOptions.value[field.name] = options;
        }
      } catch (err) {
        console.error(`Hibás JSON az optionsText mezőben (${field.name})`, err);
      }
    });
  }

  function getSelectItems(field) {
    if (Array.isArray(field.options) && field.options.length > 0) {
      return field.options.map((opt) => ({ text: opt.text, value: opt.value }));
    }

    if (typeof field.options === "object" && field.options !== null) {
      const array = Object.values(field.options).find((v) => Array.isArray(v));
      if (array) {
        return array.map((opt) => ({ text: opt.text, value: opt.value }));
      }
    }

    const data = selectOptions.value[field.name];
    if (Array.isArray(data)) {
      return data.map((opt) => ({
        text: opt?.text ?? String(opt),
        value: opt?.value ?? opt,
      }));
    }

    return [];
  }

  function getValidationRules(field) {
    const rules = [];
    const isEmpty = (val) =>
      val === "" || val === null || val === undefined || (val instanceof File && val.size === 0);

    if (field.required) {
      rules.push((v) => {
        if (field.type === "checkbox") return v === true || "Kötelező mező";
        if (field.type === "checkbox-group") return (v && v.length > 0) || "Kötelező mező";
        if (field.type === "file") return v instanceof File || "Kötelező mező";
        return !!v?.toString().trim() || "Kötelező mező";
      });
    }

    rules.push((v) => {
      if (!field.required && isEmpty(v)) return true;

      if (field.type === "number") {
        const num = Number(v);
        if (isNaN(num)) return `${field.label} nem érvényes szám.`;
        if (field.validations?.min != null && num < field.validations.min)
          return `Minimum érték: ${field.validations.min}`;
        if (field.validations?.max != null && num > field.validations.max)
          return `Maximum érték: ${field.validations.max}`;
        return true;
      }

      if (typeof v === "string") {
        if (field.validations?.min != null && v.length < field.validations.min)
          return `Minimum ${field.validations.min} karakter.`;
        if (field.validations?.max != null && v.length > field.validations.max)
          return `Maximum ${field.validations.max} karakter.`;

        if (field.validations?.pattern) {
          try {
            const regex = new RegExp(field.validations.pattern);
            if (!regex.test(v)) return `Hibás formátum`;
          } catch (e) {
            console.warn("Érvénytelen regex minta:", field.validations.pattern, e);
          }
        }

        if (field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(v)) return `Nem érvényes email.`;
        }

        if (field.type === "tel") {
          const telRegex = /^[0-9+ ]{6,20}$/;
          if (!telRegex.test(v)) return `Nem érvényes telefonszám.`;
        }
      }

      return true;
    });

    return rules;
  }

  async function submitForm() {
    errorMessages.value = [];

    const result = await formRef.value?.validate();
    if (!result?.valid) {
      errorMessages.value.push("Kérjük, javítsd a hibás mezőket.");
      return;
    }

    if (!formData.value.active) {
      errorMessages.value.push(
        'A beküldés csak akkor engedélyezett, ha a "Beküldhető" mező be van kapcsolva.',
      );
      return;
    }

    const formPayload = new FormData();

    for (const [key, value] of Object.entries(formData.value)) {
      if (value instanceof File) {
        formPayload.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => formPayload.append(key, v));
      } else {
        formPayload.append(key, value);
      }
    }

    axios
      .post("/submit", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        successMessage.value = "Sikeres beküldés!";
        setTimeout(() => {
          successMessage.value = "";
        }, 5000);
        errorMessages.value = [];
      })
      .catch((err) => {
        const fieldErrors = err.response?.data?.details?.fieldErrors;
        if (fieldErrors) {
          errorMessages.value = Object.entries(fieldErrors).flatMap(([field, messages]) =>
            messages.map((msg) => `${field}: ${msg}`),
          );
        } else {
          errorMessages.value.push("Ismeretlen hiba történt a beküldéskor.");
        }
      });
  }

  return {
    initFormData,
    loadSelects,
    getSelectItems,
    getValidationRules,
    submitForm,
  };
}
