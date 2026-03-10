<script setup lang="ts">
import { ref, onMounted, reactive, onUnmounted, nextTick } from 'vue'
import { contactService } from '@/api/contactForm'
import type { ContactFormData, Error } from '@/types/contactForm.types'
import logoUrl from '@/assets/logo/LMSH_Logo.png'

const errors = reactive<Error>({})
const submitted = ref(false)
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasSignature = ref(false)
const displayDate = ref('')
const showPopup = ref(false)
const picture = ref<File | null>(null)

const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const isCameraActive = ref(false)
const previewImage = ref<string | null>(null)

let formData: ContactFormData = {
  name: '',
  email: '',
  address: '',
  museum: '',
  employer: '',
  message: '',
  date: '',
  signature: '',
  picture: '',
}

const museumOptions = [
  { text: 'Bitte auswählen', value: '' },
  { text: 'Museum für Archäologie', value: 'Museu für Archäologie' },
  {
    text: 'Museum für Kunst und Kulturgeschichte Schloss Gottorf',
    value: 'Museum für Kunst und Kulturgeschichte Schloss Gottorf',
  },
  { text: 'Gottorfer Globus & Barockgarten', value: 'Gottorfer Globus & Barockgarten' },
  { text: 'Wickinger Museum Haithabu', value: 'Wickinger Museum Haithabu' },
  { text: 'Freilichtmuseum Molfsee', value: 'Freilichtmuseum Molfsee' },
  { text: 'Jüdisches Museum', value: 'Jüdisches Museum' },
  { text: 'Eisenkunstguss Museum Büdelsdorf', value: 'Eisenkunstguss Museum Büdelsdorf' },
  { text: 'Kloster Cismar', value: 'Kloster Cismar' },
]

onMounted(() => {
  showPopup.value = true
  // Set current date
  const today = new Date()
  formData.date = today.toISOString().split('T')[0]!

  displayDate.value = today.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  // Initialize canvas
  if (signatureCanvas.value) {
    const canvas = signatureCanvas.value
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }
})

const handleSelect = () => {
  if (formData.museum) {
    showPopup.value = false
  } else {
    alert(`Es muss ein Museum ausgewählt werden`)
  }
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  // Signature als Base64 holen
  if (signatureCanvas.value) {
    formData.signature = signatureCanvas.value.toDataURL()
  }

  formData = {
    name: formData.name,
    email: formData.email,
    address: formData.address,
    museum: formData.museum,
    employer: formData.employer,
    message: formData.message || undefined,
    date: formData.date,
    signature: formData.signature,
    picture: formData.picture,
  }

  // API-Call mit den Daten
  const response = await contactService.submitForm(formData)
  console.log(formData)
  console.log(response)

  if (response.error) {
    console.error('Fehler:', response.error)
    alert(`Fehler: ${response.error}`)
    return
  }

  console.log('Erfolgreich gespeichert:', response.data)
  submitted.value = true

  // Reset nach 3 Sekunden
  setTimeout(() => {
    Object.assign(formData, {
      name: '',
      email: '',
      address: '',
      employer: '',
      message: '',
      signature: '',
      picture: '',
    })
    formData.picture = ''
    previewImage.value = null
    clearSignature()
    submitted.value = false
  }, 3000)
}

const getCoordinates = (event: MouseEvent | TouchEvent) => {
  if (!signatureCanvas.value) return { x: 0, y: 0 }

  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()

  if (event instanceof MouseEvent) {
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  } else {
    const touch = event.touches[0]
    return {
      x: touch!.clientX - rect.left,
      y: touch!.clientY - rect.top,
    }
  }
}

const startDrawing = (event: MouseEvent | TouchEvent) => {
  isDrawing.value = true
  const { x, y } = getCoordinates(event)

  const ctx = signatureCanvas.value?.getContext('2d')
  if (ctx) {
    ctx.strokeStyle = '#1f2121'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
}

const draw = (event: MouseEvent | TouchEvent) => {
  if (!isDrawing.value) return

  const { x, y } = getCoordinates(event)
  const ctx = signatureCanvas.value?.getContext('2d')

  if (ctx) {
    ctx.lineTo(x, y)
    ctx.stroke()
    hasSignature.value = true
  }
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearSignature = () => {
  if (!signatureCanvas.value) return

  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasSignature.value = false
    formData.signature = ''
  }
}

//Input check
const validateField = (field: keyof Error) => {
  delete errors[field]

  if (field === 'name' && !formData.name.trim()) {
    errors.name = 'Name ist erforderlich'
  }

  if (field === 'email') {
    if (!formData.email.trim()) {
      errors.email = 'E-Mail ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ungültige E-Mail-Adresse'
    }
  }

  if (field === 'address' && !formData.address.trim()) {
    errors.address = 'Postanschrift ist erforderlich'
  }

  if (field === 'employer' && !formData.employer.trim()) {
    errors.employer = 'Arbeitgeber ist erforderlich'
  }
}

const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(errors).forEach((key) => delete errors[key as keyof Error])

  let isValid = true

  if (!formData.name.trim()) {
    errors.name = 'Name ist erforderlich'
    isValid = false
  }

  if (!formData.email.trim()) {
    errors.email = 'E-Mail ist erforderlich'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Ungültige E-Mail-Adresse'
    isValid = false
  }

  if (!formData.address.trim()) {
    errors.address = 'Postanschrift ist erforderlich'
    isValid = false
  }

  if (!formData.employer.trim()) {
    errors.employer = 'Arbeitgeber ist erforderlich'
    isValid = false
  }

  if (!hasSignature.value) {
    errors.signature = 'Unterschrift ist erforderlich'
    isValid = false
  }

  return isValid
}

// Kamera starten
const startCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
    await nextTick()

    const video = videoRef.value
    if (video) {
      video.srcObject = stream.value
      console.log('Stream gesetzt!')
    } else {
      console.error('Noch null?')
    }
    isCameraActive.value = true
  } catch (err) {
    console.error(err)
  }
}

// Foto machen
const takePhoto = () => {
  const video = videoRef.value
  if (!video || video.videoWidth === 0) {
    console.warn('Video lädt noch...')
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1280 // Fix ideal
  canvas.height = 720
  const ctx = canvas.getContext('2d')

  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const pictureBase64 = canvas.toDataURL('image/jpeg', 0.8)
    formData.picture = pictureBase64
    previewImage.value = pictureBase64
    console.log('Foto OK, Länge:', pictureBase64.length)
  }
}

// Kamera stoppen
const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop())
    stream.value = null
  }
  isCameraActive.value = false
}

// Neu aufnehmen
const retakePhoto = () => {
  previewImage.value = null
  formData.picture = ''
}

// Cleanup
onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div v-if="showPopup" class="modal-overlay">
    <div class="modal">
      <h3>Museum auswählen</h3>
      <div class="form-group">
        <label for="employmentType" class="form-label">Museum *</label>

        <select
          id="employmentType"
          v-model="formData.museum"
          class="custom-select"
          :class="{ error: errors.museum }"
          @blur="validateField('museum')"
          required
        >
          <option
            v-for="opt in museumOptions"
            class="custom-select-content"
            :key="opt.value"
            :value="opt.value"
            :disabled="opt.value === ''"
          >
            {{ opt.text }}
          </option>
        </select>

        <span v-if="errors.museum" class="error-message">
          {{ errors.museum }}
        </span>
      </div>
      <button type="button" class="btn btn--secondary btn--sm clear-btn" @click="handleSelect">
        OK
      </button>
    </div>
  </div>

  <div class="container">
    <div class="form-card">
      <div class="form-header">
        <div class="form-header__brand">
          <img class="form-header__logo" :src="logoUrl" alt="Logo" />
          <div class="form-header__brandText">
            <div class="logo-headline">Landesmuseen Schleswig-<br />Holstein</div>
            <br />
            <div class="logo-zusatz">Kultur des Nordens</div>
          </div>
        </div>
      </div>

      <div class="form-header-1">
        <h1>Kontakt Pressefreikarte</h1>
      </div>

      <p class="description">
        Sehr geehrte Pressevertreterinnen und -vertreter, <br />
        <br />

        wir freuen uns über Ihr Interesse an unseren Museen. Selbstverständlich laden wir Sie zu
        einem Besuch ein. <br />
        Bitte hinterlassen Sie uns Ihre Adressdaten und Erreichbarkeiten, damit wir Ihnen auch in
        Zukunft stets aktuelle Informationen über unser vielfältiges Kulturangebot zukommen lassen
        können.
      </p>

      <form @submit.prevent="handleSubmit">
        <!-- Name -->
        <div class="form-group">
          <label for="name" class="form-label"
            >Vor- und Nachname der Journalistin/ des Journalisten *</label
          >
          <input
            id="name"
            v-model="formData.name"
            type="text"
            class="form-control"
            :class="{ error: errors.name }"
            @blur="validateField('name')"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

        <!-- Arbeitgeber -->
        <div class="form-group">
          <label for="employer" class="form-label"
            >Titel der Medien / Publikation / Anschrift des Verlags *</label
          >
          <input
            id="employer"
            v-model="formData.employer"
            type="text"
            class="form-control"
            :class="{ error: errors.employer }"
            @blur="validateField('employer')"
          />
          <span v-if="errors.employer" class="error-message">{{ errors.employer }}</span>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label for="email" class="form-label">E-Mail *</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            class="form-control"
            :class="{ error: errors.email }"
            @blur="validateField('email')"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <!-- Postanschrift -->
        <div class="form-group">
          <label for="address" class="form-label">Postanschrift *</label>
          <textarea
            id="address"
            v-model="formData.address"
            class="form-control"
            :class="{ error: errors.address }"
            rows="3"
            @blur="validateField('address')"
          ></textarea>
          <span v-if="errors.address" class="error-message">{{ errors.address }}</span>
        </div>

        <!-- Nachricht (Optional) -->
        <div class="form-group">
          <label for="message" class="form-label"
            >Gerne können Sie unserer Pressestele auch eine Nachricht hinterlassen:</label
          >
          <textarea
            id="message"
            v-model="formData.message"
            class="form-control"
            rows="4"
          ></textarea>
        </div>

        <!-- Datum -->
        <div class="form-group">
          <label for="date" class="form-label">Datum</label>
          <input id="date" :value="displayDate" type="text" class="form-control" readonly />
        </div>

        <!-- Unterschrift -->
        <div class="form-group">
          <label class="form-label">Unterschrift *</label>
          <div class="signature-container">
            <canvas
              ref="signatureCanvas"
              class="signature-canvas"
              :class="{ error: errors.signature }"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              @touchstart.prevent="startDrawing"
              @touchmove.prevent="draw"
              @touchend.prevent="stopDrawing"
            ></canvas>
            <button
              type="button"
              class="btn btn--secondary btn--sm clear-btn"
              @click="clearSignature"
            >
              Zurücksetzen
            </button>
          </div>
          <span v-if="errors.signature" class="error-message">{{ errors.signature }}</span>
        </div>

        <div class="camera-section">
          <!-- Kamera-Button -->
          <button
            v-if="!isCameraActive"
            type="button"
            @click="startCamera"
            class="camera-btn"
            :disabled="isCameraActive"
          >
            📸 Kamera öffnen
          </button>

          <!-- Live-Preview & Controls -->
          <div v-show="isCameraActive" class="camera-preview">
            <video ref="videoRef" autoplay muted playsinline class="video-preview"></video>

            <div class="camera-controls">
              <button type="button" @click="takePhoto" class="photo-btn">📸 Foto machen</button>
              <button type="button" @click="stopCamera" class="stop-btn">Kamera schließen</button>
            </div>
          </div>

          <!-- Foto-Vorschau -->
          <div v-if="previewImage" class="preview-image">
            <img :src="previewImage" alt="Vorschau" />
            <button type="button" @click="retakePhoto">Neu aufnehmen</button>
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn btn--primary btn--full-width" :disabled="!previewImage">
          Absenden
        </button>

        <!-- Success Message -->
        <div v-if="submitted" class="success-message">✓ Formular erfolgreich übermittelt!</div>
      </form>
    </div>
  </div>
</template>

<style scoped>
@import '../assets/formular.css';
</style>
