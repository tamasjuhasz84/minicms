<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const submissions = ref([])

const headers = ref([
  { text: 'ID', value: 'id' },
  { text: 'Dátum', value: 'created_at' },
  { text: 'Eredmény', value: 'calculated' },
  { text: 'Űrlapadatok', value: 'data' },
])

onMounted(() => {
  axios.get('/submissions').then((res) => {
    submissions.value = res.data
  })
})
</script>

<template>
  <v-card>
    <v-card-title>Beküldött kalkulációk</v-card-title>
    <v-card-text>
      <v-data-table :headers="headers" :items="submissions" class="elevation-1" dense>
        <template v-slot:item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>
        <template v-slot:item.data="{ item }">
          <pre>{{ JSON.parse(item.data) }}</pre>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>
