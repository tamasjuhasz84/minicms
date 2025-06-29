<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import './SubmissionList.scss'

const submissions = ref([])

const headers = ref([
  { text: 'ID', value: 'id' },
  { text: 'Dátum', value: 'created_at' },
  { text: 'Űrlapadatok', value: 'data' },
  { text: 'Műveletek', value: 'actions', sortable: false },
])

function loadSubmissions() {
  axios.get('/submissions').then((res) => {
    submissions.value = res.data
  })
}

function deleteOne(id) {
  if (confirm('Biztosan törlöd ezt a rekordot?')) {
    axios.delete(`/submissions/${id}`).then(loadSubmissions)
  }
}

function deleteAll() {
  if (confirm('Biztosan törlöd az összes beküldést?')) {
    axios.delete('/submissions').then(loadSubmissions)
  }
}

function exportAll() {
  axios.get('/submissions').then((res) => {
    const data = res.data

    if (!data.length) {
      alert('Nincs mit exportálni.')
      return
    }

    const rows = data.map((row) => {
      const parsed = JSON.parse(row.data)
      return {
        id: row.id,
        created_at: new Date(row.created_at).toLocaleString(),
        ...parsed,
      }
    })

    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','), // fejléc
      ...rows.map((row) =>
        headers.map((h) => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'submissions_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  })
}

onMounted(loadSubmissions)
</script>

<template>
  <v-card class="submission-card">
    <v-card-title class="d-flex justify-space-between align-center submission-header">
      <span>Beküldött űrlapok</span>
      <div>
        <v-btn color="error" class="me-2" @click="deleteAll" size="small">
          <v-icon start>mdi-delete-forever</v-icon>
          Összes törlése
        </v-btn>
        <v-btn color="primary" @click="exportAll" size="small">
          <v-icon start>mdi-download</v-icon>
          Exportálás
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="submissions"
        class="elevation-1 submission-table"
        dense
      >
        <template v-slot:item.created_at="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>

        <template v-slot:item.data="{ item }">
          <pre>{{ JSON.parse(item.data) }}</pre>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn color="error" size="small" @click="deleteOne(item.id)">
            <v-icon start>mdi-delete</v-icon>
            Törlés
          </v-btn>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>
