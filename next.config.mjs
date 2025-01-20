/** @type {import('next').NextConfig} */
const nextConfig = {
    swcMinify: true,
    images: {
        domains: ['srv677099.hstgr.cloud'],
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
