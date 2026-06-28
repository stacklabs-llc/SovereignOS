/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/tesseract-stack',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
