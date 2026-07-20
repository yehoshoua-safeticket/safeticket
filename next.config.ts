import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Static category artwork (see src/lib/categoryImages.ts)
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // Event covers uploaded to Supabase storage
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
