import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wiiehzivmbwquepqbnnj.supabase.co",
      },
    ],
  },
};

export default nextConfig;
