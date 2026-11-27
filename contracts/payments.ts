// CONTRACT ONLY — not implemented. The future payment service (schema "app"); provider-agnostic.
// No CMS code depends on a payment provider: courses expose only price/commerce data. See docs/PAYMENTS-CONTRACT.md.

export type Money = { amount: number; currency: 'IRR' } // stored in rials; UI shows toman

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'refunded' | 'partially_refunded'
export interface Invoice {
  id: string; number: string; userId: string; status: InvoiceStatus
  lines: { kind: 'live_class' | 'offline_course' | 'event' | 'other'; refId: string; title: string; price: Money; discount?: Money }[]
  total: Money; issuedAt: string; dueAt?: string
}

export type TransactionStatus = 'initiated' | 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
export interface Transaction {
  id: string; invoiceId: string; userId: string; amount: Money; status: TransactionStatus
  gateway: string // e.g. 'zarinpal' — adapter name, never credentials
  gatewayRef?: string // authority / reference code (no card data is ever stored)
  maskedCard?: string // e.g. 6037-99**-****-1234 when the gateway returns it
  failureReason?: string
  createdAt: string; updatedAt: string
  events: { at: string; type: string; detail?: string }[] // append-only history for Support diagnostics
}

/** One adapter per gateway. Callbacks are verified server-side (amount + authority) before any state change. */
export interface PaymentGateway {
  name: string
  createPayment(input: { transactionId: string; amount: Money; callbackUrl: string; description: string; mobile?: string }): Promise<{ redirectUrl: string; gatewayRef: string }>
  verifyPayment(input: { gatewayRef: string; amount: Money }): Promise<{ ok: true; maskedCard?: string; refId: string } | { ok: false; reason: string }>
  refund?(input: { gatewayRef: string; amount: Money }): Promise<{ ok: boolean; reason?: string }>
}

/** Emitted (outbox table) after a verified payment; consumers create the enrollment. Idempotent by transactionId. */
export interface PaymentSucceededEvent { type: 'payment.succeeded'; transactionId: string; invoiceId: string; userId: string; at: string }
