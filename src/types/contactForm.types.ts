export interface ContactFormData {
  name: string
  email: string
  address: string
  employer: string
  message?: string
  date: string
  signature: string
}

export interface ContactSubmissionResponse {
  id: number
  message: string
  submittedAt: string
}

export interface ContactSubmission extends ContactFormData {
  id: number
  createdAt: string
}

export interface Error {
  name?: string
  email?: string
  address?: string
  employer?: string
  signature?: string
}
