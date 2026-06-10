/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zequel/ui", "@zequel/shared", "@zequel/types"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}

export default nextConfig
