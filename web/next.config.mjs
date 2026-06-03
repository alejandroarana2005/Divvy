/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: false,
  serverExternalPackages: ['mysql2'],
};

export default nextConfig;
