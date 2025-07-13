<script setup>
import { ref, onMounted } from "vue";
import axios from "@/utils/axios";
import * as XLSX from "xlsx";
import "./SubmissionList.scss";

const submissions = ref([]);
const errorMessage = ref("");

const headers = ref([
  { text: "ID", value: "id" },
  { text: "Dátum", value: "created_at" },
  { text: "IP cím", value: "ip_address" },
  { text: "Űrlapadatok", value: "data" },
  { text: "Műveletek", value: "actions", sortable: false },
]);

function showError(msg) {
  errorMessage.value = msg;
}

function handleAuthError(error) {
  if (error.response?.status === 403) {
    showError("A munkamenet lejárt. Kérlek, jelentkezz be újra.");
    localStorage.removeItem("jwt");
    window.location.href = "/admin";
  } else {
    showError("Hiba történt a lekérdezés során.");
    console.error(error);
  }
}

function loadSubmissions() {
  axios
    .get("/submissions")
    .then((res) => {
      submissions.value = res.data;
    })
    .catch(handleAuthError);
}

function deleteOne(id) {
  if (confirm("Biztosan törlöd ezt a rekordot?")) {
    axios.delete(`/submissions/${id}`).then(loadSubmissions).catch(handleAuthError);
  }
}

function deleteAll() {
  if (confirm("Biztosan törlöd az összes beküldést?")) {
    axios.delete("/submissions").then(loadSubmissions).catch(handleAuthError);
  }
}

function getExportRows(data) {
  return data.map((row) => {
    const parsed = JSON.parse(row.data);
    return {
      ID: row.id,
      Dátum: new Date(row.created_at).toLocaleString(),
      IP: row.ip_address || "ismeretlen",
      ...parsed,
    };
  });
}

function exportCSV() {
  axios
    .get("/submissions")
    .then((res) => {
      const rows = getExportRows(res.data);
      if (!rows.length) {
        showError("Nincs mit exportálni.");
        return;
      }

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          headers.map((h) => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "submissions_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })
    .catch(handleAuthError);
}

function exportXLSX() {
  axios
    .get("/submissions")
    .then((res) => {
      const rows = getExportRows(res.data);
      if (!rows.length) {
        showError("Nincs mit exportálni.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Beküldések");
      XLSX.writeFile(workbook, "submissions_export.xlsx");
    })
    .catch(handleAuthError);
}

onMounted(loadSubmissions);
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
        <v-btn color="primary" class="me-2" @click="exportCSV" size="small">
          <v-icon start>mdi-file-delimited</v-icon>
          CSV Export
        </v-btn>
        <v-btn color="primary" @click="exportXLSX" size="small">
          <v-icon start>mdi-file-excel</v-icon>
          XLSX Export
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <v-alert v-if="errorMessage" type="error" dismissible @input="errorMessage = ''" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-data-table
        :headers="headers"
        :items="submissions"
        class="elevation-1 submission-table"
        dense
      >
        <template v-slot:[`item.id`]="{ item }">
          {{ item.id }}
        </template>

        <template v-slot:[`item.created_at`]="{ item }">
          {{ new Date(item.created_at).toLocaleString() }}
        </template>

        <template v-slot:[`item.ip_address`]="{ item }">
          {{ item.ip_address || "ismeretlen" }}
        </template>

        <template v-slot:[`item.data`]="{ item }">
          <pre>{{ JSON.parse(item.data) }}</pre>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn color="error" size="small" @click="deleteOne(item.id)">
            <v-icon start>mdi-delete</v-icon>
            Törlés
          </v-btn>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>
