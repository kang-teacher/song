import type { NextConfig } from "next";

// GitHub Pages용 정적 사이트로 내보낸다 (서버 없음).
// 저장소 이름이 주소에 붙으므로(/song) 배포 워크플로가 PAGES_BASE_PATH로 넘겨준다.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.PAGES_BASE_PATH || "",
  images: { unoptimized: true },
};

export default nextConfig;
