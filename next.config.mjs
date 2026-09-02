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
    ];
  },
};
export default nextConfig;
