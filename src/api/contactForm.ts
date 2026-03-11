import { type ApiResponse, api } from './api'
import type {
  ContactFormData,
  ContactSubmission,
  ContactSubmissionResponse,
} from '@/types/contactForm.types.ts'

class ContactService {
  // Formular absenden
  async submitForm(formData: ContactFormData): Promise<ApiResponse<ContactSubmissionResponse>> {
    return api.post<ContactSubmissionResponse>('/api/contact/submit', formData)
  }

  // Alle Submissions abrufen
  async getAllSubmissions(): Promise<ApiResponse<ContactSubmission[]>> {
    return api.get<ContactSubmission[]>('/api/contact/submissions')
  }

  // Einzelne Submission abrufen
  async getSubmissionById(id: number): Promise<ApiResponse<ContactSubmission>> {
    return api.get<ContactSubmission>(`/api/contact/submissions/${id}`)
  }

  // Submission löschen
  async deleteSubmission(id: number): Promise<ApiResponse<void>> {
    return api.delete<void>(`/api/contact/submissions/${id}`)
  }

  // Submission aktualisieren
  async updateSubmission(
    id: number,
    formData: Partial<ContactFormData>,
  ): Promise<ApiResponse<ContactSubmission>> {
    return api.put<ContactSubmission>(`/api/contact/submissions/${id}`, formData)
  }
}

// Singleton exportieren
export const contactService = new ContactService()
