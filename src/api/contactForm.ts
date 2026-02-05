import { type ApiResponse, api } from './api'
import type {
  ContactFormData,
  ContactSubmission,
  ContactSubmissionResponse,
} from '@/types/contactForm.types'

class ContactService {
  // Formular absenden
  async submitForm(formData: ContactFormData): Promise<ApiResponse<ContactSubmissionResponse>> {
    return api.post<ContactSubmissionResponse>('/contact/submit', formData)
  }

  // Alle Submissions abrufen
  async getAllSubmissions(): Promise<ApiResponse<ContactSubmission[]>> {
    return api.get<ContactSubmission[]>('/contact/submissions')
  }

  // Einzelne Submission abrufen
  async getSubmissionById(id: number): Promise<ApiResponse<ContactSubmission>> {
    return api.get<ContactSubmission>(`/contact/submissions/${id}`)
  }

  // Submission löschen
  async deleteSubmission(id: number): Promise<ApiResponse<void>> {
    return api.delete<void>(`/contact/submissions/${id}`)
  }

  // Submission aktualisieren
  async updateSubmission(
    id: number,
    formData: Partial<ContactFormData>,
  ): Promise<ApiResponse<ContactSubmission>> {
    return api.put<ContactSubmission>(`/contact/submissions/${id}`, formData)
  }
}

// Singleton exportieren
export const contactService = new ContactService()
