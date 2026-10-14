import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export estático — Cloudflare Pages serve a pasta /out
  output: "export",
  images: {
    unoptimized: true,
  },
  // Evita erros com rotas dinâmicas no export
  trailingSlash: true,
};

export default nextConfig;
