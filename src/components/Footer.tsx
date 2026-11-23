import { Link } from 'react-router-dom'
import { ArrowLeft, Leaf } from './Icons'
import { Logo } from './Header'
import { fa } from '../lib/fa'

export function Cta() {
  return (
    <section className="cta-wrap">
      <div className="container">
        <div className="cta rv">
          <Leaf className="leaf leaf-cta" />
          <h2>آیندهٔ بهتر را با فرتاش بسازید</h2>
          <p>به هزاران زبان‌آموز بپیوندید و مسیر موفقیتتان را شروع کنید.</p>
          <Link to="/placement" className="btn btn-primary btn-lg">تعیین سطح رایگان <ArrowLeft /></Link>
        </div>
      </div>
    </section>
  )
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-in">
        <Logo small />
        <p>© {fa(1405)} فرتاش، آموزشگاه آنلاین زبان. همهٔ حقوق محفوظ است.</p>
      </div>
    </footer>
  )
}
