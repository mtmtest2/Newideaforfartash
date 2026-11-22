const DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Latin digits → Persian digits for display only. */
export const fa = (v: string | number): string => String(v).replace(/\d/g, (d) => DIGITS[+d])

/** Persian / Arabic-Indic digits → Latin, for validation and payloads. */
export const toLatin = (v: string): string =>
  v.replace(/[۰-۹]/g, (d) => String(DIGITS.indexOf(d))).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))

export const faMoney = (n: number): string =>
  fa(n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬')) + ' تومان'

export const isIranMobile = (v: string): boolean => /^(\+98|0098|0)?9\d{9}$/.test(toLatin(v).replace(/[\s-]/g, ''))
