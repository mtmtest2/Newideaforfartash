import { Spark } from './Icons'
export default function SectionHead({ tag, title, text }: { tag: string; title: string; text?: string }) {
  return (
    <div className="sec-head rv">
      <span className="pill">{tag}</span>
      <h2><Spark className="spark" />{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}
