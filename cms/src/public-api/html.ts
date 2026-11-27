import { convertLexicalToHTML, defaultHTMLConverters } from '@payloadcms/richtext-lexical/html'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const textOf = (node: { children?: unknown[]; text?: string }): string =>
  node.text ?? (node.children ?? []).map((c) => textOf(c as never)).join('')
export const headingId = (t: string, i: number) => `h-${i}-${t.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 48)}`

/** Safe embed URL for Aparat / YouTube only (anything else is dropped). */
function embedUrl(url: string) {
  const yt = url.match(/^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const ap = url.match(/^https:\/\/(?:www\.)?aparat\.com\/v\/([\w-]+)/)
  if (ap) return `https://www.aparat.com/video/video/embed/videohash/${ap[1]}/vt/frame`
  return null
}

/** Rich text -> HTML string + table of contents. Text is escaped by Payload's converters; our block converters escape too. */
export function richTextToHtml(data: unknown, mediaUrl: (doc: Record<string, unknown>) => string | null) {
  if (!data || typeof data !== 'object') return { html: '', toc: [] as { id: string; text: string; level: number }[] }
  const toc: { id: string; text: string; level: number }[] = []
  let n = 0
  const html = convertLexicalToHTML({
    data: data as never,
    disableContainer: true,
    converters: ({ defaultConverters }) => ({
      ...defaultConverters,
      heading: ({ node, nodesToHTML }) => {
        const tag = (node as { tag: string }).tag
        const text = textOf(node as never)
        const id = headingId(text, n++)
        if (tag === 'h2' || tag === 'h3') toc.push({ id, text, level: tag === 'h2' ? 2 : 3 })
        return `<${tag} id="${esc(id)}">${nodesToHTML({ nodes: (node as unknown as { children: never[] }).children }).join('')}</${tag}>`
      },
      upload: ({ node }) => {
        const v = (node as unknown as { value?: Record<string, unknown> }).value
        if (!v || typeof v !== 'object') return ''
        const src = mediaUrl(v)
        return src ? `<figure class="m-figure"><img src="${esc(src)}" alt="${esc(v.alt)}" width="${esc(v.width)}" height="${esc(v.height)}" loading="lazy" decoding="async"></figure>` : ''
      },
      blocks: {
        tip: ({ node }: { node: unknown }) => { const f = (node as { fields: { tone?: string; text?: string } }).fields; return `<aside class="m-tip m-tip-${esc(f.tone)}"><p>${esc(f.text)}</p></aside>` },
        vocab: ({ node }: { node: unknown }) => {
          const f = (node as { fields: { title?: string; items?: { term: string; meaning: string; example?: string }[] } }).fields
          return `<section class="m-vocab">${f.title ? `<h4>${esc(f.title)}</h4>` : ''}<dl>${(f.items ?? []).map((i) => `<div><dt dir="auto">${esc(i.term)}</dt><dd>${esc(i.meaning)}${i.example ? `<small dir="auto">${esc(i.example)}</small>` : ''}</dd></div>`).join('')}</dl></section>`
        },
        dialogue: ({ node }: { node: unknown }) => {
          const f = (node as { fields: { lines?: { speaker: string; text: string; translation?: string }[] } }).fields
          return `<section class="m-dialogue">${(f.lines ?? []).map((l) => `<p><b>${esc(l.speaker)}:</b> <span dir="auto">${esc(l.text)}</span>${l.translation ? `<small>${esc(l.translation)}</small>` : ''}</p>`).join('')}</section>`
        },
        video: ({ node }: { node: unknown }) => {
          const f = (node as { fields: { url?: string; title?: string } }).fields
          const src = embedUrl(String(f.url ?? ''))
          return src ? `<figure class="m-video"><iframe src="${esc(src)}" title="${esc(f.title)}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></figure>` : ''
        },
        code: ({ node }: { node: unknown }) => { const f = (node as { fields: { code?: string; language?: string } }).fields; return `<pre class="m-code" dir="ltr"><code data-lang="${esc(f.language)}">${esc(f.code)}</code></pre>` },
      },
    }),
  })
  return { html, toc }
}
export { defaultHTMLConverters }
