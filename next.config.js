const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // i18n,
  output: 'export',
  distDir: 'release',

  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  transpilePackages: ['@douyinfe/semi-ui', '@douyinfe/semi-icons', '@douyinfe/semi-illustrations'],
}

module.exports = nextConfig
