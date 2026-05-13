import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ecommerce/shared", "@ecommerce/database"],
};

export default nextConfig;
