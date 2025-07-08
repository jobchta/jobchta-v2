/** @type {import('next').NextConfig} */
const nextConfig = {
  // This setting tells Next.js to only consider files ending in ".page.tsx"
  // as part of the old Pages Router. Since you have no files with this
  // extension, it effectively disables it and forces the build to
  // only use your `app` directory.
  pageExtensions: ['page.tsx'],
};

export default nextConfig;