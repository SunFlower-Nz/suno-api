/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(ttf|html)$/i,
      type: 'asset/resource'
    });
    
    // Externalize problematic native modules to avoid bundling issues
    if (isServer) {
      config.externals = [...(config.externals || [])];
      // Add native/binary modules as externals
      config.externals.push(
        'cycletls',
        'electron', 
        'bufferutil',
        'utf-8-validate',
        '@playwright/browser-chromium',
        'rebrowser-playwright-core',
        'chromium-bidi',
      );
    }
    
    return config;
  },
  experimental: {
    serverMinification: false, // the server minification unfortunately breaks the selector class names
    serverComponentsExternalPackages: [
      'cycletls',
      'electron',
      'bufferutil', 
      'utf-8-validate',
      '@playwright/browser-chromium',
      'rebrowser-playwright-core',
      'chromium-bidi',
      'pino',
      'pino-pretty',
    ],
  },
};  

export default nextConfig;
