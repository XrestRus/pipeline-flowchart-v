/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  output: 'standalone',
  reactStrictMode: true,
  env: {
    DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
    DATABASE_PORT: process.env.DATABASE_PORT || '3306',
    DATABASE_USER: process.env.DATABASE_USER || 'pipeline_user',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'pipeline_password',
    DATABASE_NAME: process.env.DATABASE_NAME || 'pipeline_db'
  },
}

export default nextConfig
