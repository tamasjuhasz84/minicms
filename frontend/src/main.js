import { createApp } from "vue";
import App from "./App.vue";

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import axios from "@/utils/axios";

// Axios interceptor a JWT tokenhez
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Vuetify theme konfiguráció
const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#1976d2",
          background: "#ffffff",
          surface: "#f8f9fa",
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#90caf9",
          background: "#121212",
          surface: "#1e1e1e",
        },
      },
    },
  },
});

createApp(App).use(vuetify).mount("#app");
