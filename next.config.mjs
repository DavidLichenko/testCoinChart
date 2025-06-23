/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'finnhub.io',
            },
            {
                protocol: 'https',
                hostname: 'static2.finnhub.io',
            },
            {
                protocol: 'https',
                hostname: 'static.forexlive.com',
            },
            {
                protocol: 'https',
                hostname: 'images.forexlive.com',
            },
            {
                protocol: 'https',
                hostname: 'www.investing.com',
            },
            {
                protocol: 'https',
                hostname: 'images.wsj.net',
            },
            {
                protocol: 'https',
                hostname: 'cdn.snapi.dev',
            },
            {
                protocol: 'https',
                hostname: 'cdn.sanity.io',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                
                protocol: 'https',
                hostname: 'cryptocurrencynews.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.cnbc.com',
            },
            {
                protocol: 'https',
                hostname: 's3-symbol-logo.tradingview.com',
            },
            {
                protocol: 'https',
                hostname: 'assets.bwbx.io',
            },
            {
                protocol: 'https',
                hostname: 'image.cnbcfm.com',
            },
            {
                protocol: 'https',
                hostname: 'www.marketwatch.com',
            },
            {
                protocol: 'https',
                hostname: 'media-cldnry.s-nbcnews.com',
            },
            {
                protocol: 'https',
                hostname: 'media.zenfs.com',
            },
            {
                protocol: 'https',
                hostname: 'img.etimg.com',
            },
            {
                protocol: 'https',
                hostname: 'data.bloomberglp.com',
            }
        ],
    }
}

export default nextConfig;
