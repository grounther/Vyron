/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      { source: '/events/:path*', destination: '/homes', permanent: false },
      { source: '/sell', destination: '/place-home', permanent: false },
      { source: '/organizers/:path*', destination: '/about', permanent: false },
      { source: '/organizer/:path*', destination: '/account', permanent: false },
      { source: '/orders/:path*', destination: '/account', permanent: false },
      { source: '/validate/:path*', destination: '/', permanent: false },
      { source: '/shop', destination: '/homes', permanent: false },
      { source: '/search', destination: '/homes', permanent: false },
      { source: '/category/:path*', destination: '/homes', permanent: false },
      { source: '/product/:path*', destination: '/homes', permanent: false },
      { source: '/cart', destination: '/account', permanent: false },
      { source: '/checkout', destination: '/account', permanent: false },
      { source: '/checkout/success', destination: '/account', permanent: false },
      { source: '/market', destination: '/homes', permanent: false },
      { source: '/tcg/:path*', destination: '/', permanent: false },
      { source: '/card-scanner', destination: '/', permanent: false },
      { source: '/okfashion/:path*', destination: '/', permanent: false },
      { source: '/returns', destination: '/terms', permanent: false },
      { source: '/shipping', destination: '/about', permanent: false },
      { source: '/track-order', destination: '/account', permanent: false },
    ];
  },
};
export default nextConfig;
