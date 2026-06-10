/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship raw TypeScript/TSX and must be transpiled by Next.
  transpilePackages: ["@zequel/ui", "@zequel/shared", "@zequel/types"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
