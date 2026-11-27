import {
  BlocksFeature, CodeBlock, EXPERIMENTAL_TableFeature, FixedToolbarFeature, HeadingFeature, lexicalEditor, defaultEditorFeatures,
} from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

/** Educational content blocks available inside articles (only these; no free-form HTML). */
export const EDU_BLOCKS: Block[] = [
  { slug: 'tip', labels: { singular: 'نکته', plural: 'نکته‌ها' }, fields: [
    { name: 'tone', label: 'نوع', type: 'select', defaultValue: 'tip', options: [{ label: 'نکته', value: 'tip' }, { label: 'هشدار', value: 'warning' }, { label: 'یادآوری', value: 'note' }] },
    { name: 'text', label: 'متن', type: 'textarea', required: true }] },
  { slug: 'vocab', labels: { singular: 'فهرست واژه', plural: 'فهرست واژه‌ها' }, fields: [
    { name: 'title', label: 'عنوان', type: 'text' },
    { name: 'items', label: 'واژه‌ها', type: 'array', minRows: 1, fields: [
      { name: 'term', label: 'واژه', type: 'text', required: true }, { name: 'meaning', label: 'معنی', type: 'text', required: true },
      { name: 'example', label: 'مثال', type: 'text' }] }] },
  { slug: 'dialogue', labels: { singular: 'گفت‌وگوی نمونه', plural: 'گفت‌وگوهای نمونه' }, fields: [
    { name: 'lines', label: 'سطرها', type: 'array', minRows: 2, fields: [
      { name: 'speaker', label: 'گوینده', type: 'text', required: true }, { name: 'text', label: 'جمله', type: 'text', required: true },
      { name: 'translation', label: 'ترجمه', type: 'text' }] }] },
  { slug: 'video', labels: { singular: 'ویدیو', plural: 'ویدیوها' }, fields: [
    { name: 'url', label: 'آدرس ویدیو (آپارات یا یوتیوب)', type: 'text', required: true,
      validate: (v: unknown) => /^https:\/\/(www\.)?(aparat\.com|youtube\.com|youtu\.be)\//.test(String(v ?? '')) || 'فقط آدرس آپارات یا یوتیوب با https.' },
    { name: 'title', label: 'عنوان', type: 'text', required: true }] },
  CodeBlock({ slug: 'code', languages: { plaintext: 'متن', ts: 'TypeScript', js: 'JavaScript', html: 'HTML', css: 'CSS' } }) as Block,
]

export const articleEditor = lexicalEditor({
  features: () => [
    ...defaultEditorFeatures.filter((f) => f.key !== 'heading'),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] }), // h1 is the article title
    EXPERIMENTAL_TableFeature(),
    BlocksFeature({ blocks: EDU_BLOCKS }),
    FixedToolbarFeature(),
  ],
})
export const simpleEditor = lexicalEditor({
  features: () => [...defaultEditorFeatures.filter((f) => !['upload', 'relationship', 'heading'].includes(f.key)), HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }), FixedToolbarFeature()],
})
