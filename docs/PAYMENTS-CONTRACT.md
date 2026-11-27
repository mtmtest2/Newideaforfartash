# Payments — integration contract (not implemented)

Types: `contracts/payments.ts`, `contracts/enrollment.ts`.

- **Boundaries**: the payment service (schema `app`) owns invoices, transactions and gateway adapters. The CMS only
  stores catalogue data (price, discount, purchasable, access days) and is never coupled to a gateway.
- **Flow**: create invoice → create transaction (`initiated`) → redirect to gateway → callback → server-side
  `verifyPayment` (amount + reference) → `succeeded`/`failed` → outbox `payment.succeeded` → enrollment created
  (idempotent by transaction id) → course access.
- **Stored**: gateway name, reference/authority, masked card if returned, failure reason, event history.
  **Never stored**: card numbers, CVV, passwords, gateway secrets (env only).
- **Refunds**: only if the gateway supports them, behind `transactions.refund` (Owner-granted), always audited.
- **Support view** (later): read-only transaction list/detail with event history for diagnosis.
