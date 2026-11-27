import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  agentRules: false,
  // The CMS is only the Support Dashboard + content API; it never serves the public site.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ],
    }]
  },
}
export default withPayload(nextConfig, { devBundleServerPackages: false })
