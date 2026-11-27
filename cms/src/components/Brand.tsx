/* Fartash branding inside the Support Dashboard (login screen + nav). */
export function Logo() {
  return (
    <span className="fx-logo" aria-label="فرتاش — داشبورد پشتیبانی">
      <img className="fx-logo-day" src="/brand/logo-day.webp" alt="" width={176} height={45} />
      <img className="fx-logo-night" src="/brand/logo-night.webp" alt="" width={176} height={45} />
      <small>داشبورد پشتیبانی</small>
    </span>
  )
}
export function Icon() {
  return <img src="/brand/icon.png" alt="فرتاش" width={28} height={28} style={{ borderRadius: 8 }} />
}
