const DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Latin digits → Persian digits for display only. */
export const fa = (v: string | number): string => String(v).replace(/\d/g, (d) => DIGITS[+d])

/** Persian / Arabic-Indic digits → Latin, for validation and payloads. */
export const toLatin = (v: string): string =>
  v.replace(/[۰-۹]/g, (d) => String(DIGITS.indexOf(d))).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

const faNum = new Intl.NumberFormat('fa-IR')
/** Persian digits with the Persian thousands separator (۱۵٬۲۳۰٬۰۰۰). */
export const faAmount = (n: number): string => faNum.format(n)
export const faMoney = (n: number): string => `${faAmount(n)} تومان`

export const isIranMobile = (v: string): boolean => /^(\+98|0098|0)?9\d{9}$/.test(toLatin(v).replace(/[\s-]/g, ''))

/** A number that may have decimals, with Persian digits and the Persian decimal separator (۱۸٫۵). */
export const faDec = (n: number, digits = 1): string => fa(String(Number(n.toFixed(digits)))).replace('.', '٫')
