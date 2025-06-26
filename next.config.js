/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Automatische API URL basierend auf der Umgebung
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || '/api'  // In Production: relative URL oder explizit gesetzte URL
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'  // In Development: localhost
  },
  
  // Für bessere Performance in Production
  output: 'standalone',
  
  // Experimentelle Features für bessere Performance
  experimental: {
    optimizeCss: true,
  },
  
  // Backend-Dateien von Next.js Build ausschließen
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Rewrites für API Proxy in Production (optional)
  async rewrites() {
    // Nur in Production, wenn keine explizite API URL gesetzt ist
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*', // Lokaler Backend Server
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig 