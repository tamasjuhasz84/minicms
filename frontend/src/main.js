// frontend/src/main.js
import { createApp } from 'vue';
import App from './App.vue';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

const vuetify = createVuetify({ components });

createApp(App).use(vuetify).mount('#app');
