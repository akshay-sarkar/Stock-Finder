/** @type {import('next').NextConfig} */

// ─── Security headers applied to every route ─────────────────────────────────
const securityHeaders = [
  // Prevent this page being embedded as an iframe (clickjacking)
  { key: 'X-Frame-Options',        value: 'DENY' },

  // Stop browsers from MIME-sniffing away from the declared Content-Type
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Only send the origin (no path/query) in the Referer header for cross-origin requests
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },

  // Disable browser features the app doesn't use
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(), payment=()' },

  // Content Security Policy
  // - default-src 'self'          → only load resources from our own origin by default
  // - script-src 'self' 'unsafe-inline' → Next.js inline hydration scripts need unsafe-inline;
  //   nonces would be better but require server-side rendering middleware
  // - style-src 'self' 'unsafe-inline' → Tailwind injects styles at runtime
  // - img-src 'self' data: https:  → allow external images (e.g. shields.io badges)
  // - connect-src 'self'           → fetch() only to our own API routes
  // - frame-ancestors 'none'       → belt-and-suspenders with X-Frame-Options
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com",   // unsafe-eval needed by Next.js dev HMR; s3.tradingview.com for chart widget
      "style-src 'self' 'unsafe-inline' https://s3.tradingview.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://s3.tradingview.com",
      "connect-src 'self' https://*.tradingview.com wss://*.tradingview.com https://*.tradingview-widget.com",
      "frame-src https://*.tradingview.com https://*.tradingview-widget.com https://s.tradingview.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2', 'technicalindicators'],
  },

  async headers() {
    return [
      {
        // Apply to every page and API route
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
