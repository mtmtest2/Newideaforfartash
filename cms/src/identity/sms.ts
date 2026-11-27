// SMS delivery for one-time codes. No provider is wired yet (the owner is still choosing one), so:
// - SMS_PROVIDER unset  → OTP sign-in is reported as unavailable; the UI shows it as "coming soon". Nothing is faked.
// - SMS_PROVIDER=console → development only: the code is written to the CMS log. Refused when NODE_ENV=production.
// To add a real provider, implement `SmsProvider` (e.g. Kavenegar verify/lookup API) and register it in `providers`.
export type SmsProvider = { name: string; sendOtp: (phone: string, code: string) => Promise<void> }

const consoleProvider: SmsProvider = {
  name: 'console',
  async sendOtp(phone, code) { console.log(`[otp:dev] ${phone.slice(0, 4)}***${phone.slice(-2)} → ${code}`) },
}
const providers: Record<string, SmsProvider> = { console: consoleProvider }

export function smsProvider(): SmsProvider | null {
  const name = (process.env.SMS_PROVIDER || '').trim().toLowerCase()
  if (!name) return null
  if (name === 'console' && process.env.NODE_ENV === 'production') return null
  return providers[name] ?? null
}
/** True only for the development console provider: lets local tests read the code from the response. */
export const isDevProvider = (p: SmsProvider | null) => p?.name === 'console' && process.env.NODE_ENV !== 'production'
