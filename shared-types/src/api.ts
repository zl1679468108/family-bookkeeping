/* ========== API Envelope ========== */
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiErrorPayload {
  success?: false
  message: string
  statusCode?: number
  code?: string
  error?: string
}
