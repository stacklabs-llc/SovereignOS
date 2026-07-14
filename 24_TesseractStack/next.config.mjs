/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/tesseract-stack',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:3016 https://clio.taila01894.ts.net:3016 http://127.0.0.1:3016 http://localhost:3010 http://127.0.0.1:3010 https://clio.taila01894.ts.net:3010 http://localhost:3025 http://127.0.0.1:3025 https://clio.taila01894.ts.net:3025 http://localhost:3026 http://127.0.0.1:3026 https://clio.taila01894.ts.net:3026 http://127.0.0.1:3000 http://localhost:3000;",
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ]
  },
}

export default nextConfig

