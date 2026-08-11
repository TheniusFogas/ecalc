/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // FIX (audit 2026-08-11): these five legacy routes were simplified early duplicates of the
  // "-pro" calculators, still live and crawlable, all silently canonicalizing to the homepage
  // (see root layout fix). A 301 keeps whatever link equity they've accumulated and points it
  // at the real page instead of leaving two indexable, duplicate-content versions of the same
  // calculator competing with each other.
  async redirects() {
    const currentYear = new Date().getFullYear();
    return [
      { source: '/salarii', destination: `/calculator-salarii-pro/${currentYear}`, permanent: true },
      { source: '/e-factura', destination: `/calculator-efactura/${currentYear}`, permanent: true },
      { source: '/imobiliare', destination: `/calculator-imobiliare-pro/${currentYear}`, permanent: true },
      { source: '/impozit-auto', destination: `/calculator-impozit-auto/${currentYear}`, permanent: true },
      { source: '/concediu-medical', destination: `/calculator-concediu-medical/${currentYear}`, permanent: true },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: 'Content-Security-Policy',
            // FIX (audit 2026-08-11): added https://ecalc.artgrup.workers.dev to connect-src —
            // it backs the ChatFloat assistant widget (components/ChatFloat.js), which the CSP
            // would otherwise silently block from the browser the moment it's mounted.
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.open-meteo.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ipapi.co https://*.open-meteo.com https://ecalc.artgrup.workers.dev; frame-ancestors 'none';",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          { 
            key: "Access-Control-Allow-Origin", 
            value: process.env.CORS_ORIGINS || "*" 
          },
          { 
            key: "Access-Control-Allow-Methods", 
            value: "GET, POST, PUT, DELETE, OPTIONS" 
          },
          { 
            key: "Access-Control-Allow-Headers", 
            value: "*" 
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
