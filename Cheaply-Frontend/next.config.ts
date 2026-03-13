import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 這裡可以放其他的設定，例如 reactStrictMode: true */
  reactStrictMode: true,
  // 拿掉 rewrites，改交給 Nginx 處理
};

export default nextConfig;