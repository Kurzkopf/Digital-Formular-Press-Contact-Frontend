<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Submission, Page } from '@/types/admin.types'
import { getAllSubmissions, sendMailSubmission } from '@/api/admin'

const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(0)
const size = ref(50)
const data = ref<Page<Submission> | null>(null)
const rows = computed(() => data.value?.content ?? [])
const showPictureModal = ref(false)
const selectedPicture = ref<string | null>(null)

const load = async () => {
  loading.value = true
  error.value = null

  const res = await getAllSubmissions(page.value, size.value)

  if (res.error) {
    error.value = res.error
    data.value = null
  } else {
    data.value = res.data ?? null
  }

  loading.value = false
}

const prevPage = async () => {
  if (!data.value || data.value.first) return
  page.value -= 1
  await load()
}

const nextPage = async () => {
  if (!data.value || data.value.last) return
  page.value += 1
  await load()
}

const escapeCsv = (value: unknown) => {
  const s = value === null || value === undefined ? '' : String(value)
  const needsQuotes = /[",\r\n]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

const downloadTextFile = (content: string, filename: string, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

const exportRowAsCsv = (r: Submission) => {
  const header = [
    'id',
    'createdAt',
    'name',
    'email',
    'address',
    'employer',
    'message',
    'picture',
    'submissionDate',
  ]

  const row = [
    r.id,
    r.createdAt,
    r.name,
    r.email,
    r.address,
    r.employer,
    r.message ?? '',
    r.picture ?? '',
    r.submissionDate,
  ]

  const csv = [header.map(escapeCsv).join(','), row.map(escapeCsv).join(',')].join('\r\n')

  downloadTextFile(csv, `contact-submission-${r.id}.csv`)
}

const sendMail = async (id: number) => {
  const resonse = await sendMailSubmission(id)
}

const openPictureModal = (picture?: string | null) => {
  if (!picture) return
  selectedPicture.value = `${picture}`
  showPictureModal.value = true
}

const closePictureModal = () => {
  showPictureModal.value = false
  selectedPicture.value = null
}

onMounted(load)
</script>

<template>
  <div style="padding: 16px; max-width: 1200px; margin: 0 auto">
    <h1>Admin</h1>

    <div v-if="loading">Lade…</div>
    <div v-else-if="error" style="color: #b91c1c">Fehler: {{ error }}</div>

    <template v-else>
      <div style="display: flex; gap: 8px; align-items: center; margin: 12px 0">
        <button type="button" @click="prevPage" :disabled="!data || data.first">Zurück</button>
        <button type="button" @click="nextPage" :disabled="!data || data.last">Weiter</button>

        <span v-if="data" style="margin-left: auto">
          Seite {{ data.number + 1 }} / {{ data.totalPages }} ({{ data.totalElements }} Einträge)
        </span>
      </div>

      <div style="overflow: auto; border: 1px solid #e5e7eb; border-radius: 8px">
        <table style="border-collapse: collapse; width: 100%; min-width: 1100px">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">ID</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Created
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">Name</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Email
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Address
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Employer
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Museum
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Message
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Picture
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Submission date
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Export
              </th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb">
                Send Mail (Admin)
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ r.id }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ r.createdAt }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ r.name }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ r.email }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; white-space: pre-wrap">
                {{ r.address }}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ r.employer }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ r.museum }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; white-space: pre-wrap">
                {{ r.message ?? '' }}
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">
                <button v-if="r.picture" type="button" @click="openPictureModal(r.picture ?? '')">
                  Bild anzeigen
                </button>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">{{ r.submissionDate }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">
                <button type="button" @click="exportRowAsCsv(r)">CSV</button>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #f1f5f9">
                <button type="button" @click="sendMail(r.id)">Send Mail</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
  <div
    v-if="showPictureModal"
    style="
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    "
    @click.self="closePictureModal"
  >
    <div
      style="
        background: white;
        padding: 16px;
        border-radius: 8px;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        gap: 8px;
      "
    >
      <img
        v-if="selectedPicture"
        :src="selectedPicture"
        alt="Foto"
        style="max-width: 80vw; max-height: 70vh; object-fit: contain"
      />
      <button type="button" @click="closePictureModal">Schließen</button>
    </div>
  </div>
</template>
