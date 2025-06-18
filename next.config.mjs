/** @type {import('next').NextConfig} */
const nextConfig = {
    swcMinify: true,
    images: {
        domains: ['https://web-production-2d590.up.railway.app'],
        unoptimized: true,
    },
    experimental: {
        appDir: true, // Enable if you're using the App Router
        serverActions: true
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    optimizeFonts:true,
    reactStrictMode: false
};

export default nextConfig;
