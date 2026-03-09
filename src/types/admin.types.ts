export type Submission = {
  id: number
  name: string
  email: string
  address: string
  museum: string
  employer: string
  message?: string | null
  submissionDate: string
  signature: string
  picture?: string
  createdAt: string
}

export type Page<T> = {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}