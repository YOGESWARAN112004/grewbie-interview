/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Bypasses the Node.js OOM worker error during compilation
    experimental: {
        memoryBasedWorkersCount: true,
    },
};

export default nextConfig;
