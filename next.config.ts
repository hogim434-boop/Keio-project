import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // View Transitions API 활성화 — React <ViewTransition> 컴포넌트 사용 가능
    // Next.js 16 + React canary 기능. 미지원 브라우저는 일반 라우팅으로 graceful degradation
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      // Unsplash — 랜딩 페이지 배경 사진 (캠퍼스 분위기) 호스팅 도메인
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },
  // 같은 Wi-Fi의 스마트폰에서 dev 서버 접속 시 HMR/리소스 cross-origin 차단을 우회.
  // .env.local에 ALLOWED_DEV_ORIGIN=192.168.128.131 형태로 본인 LAN IP를 설정.
  // (팀원마다 IP가 다르므로 코드에 하드코딩하지 않고 환경변수로 관리)
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGIN
    ? [process.env.ALLOWED_DEV_ORIGIN]
    : [],
};

export default nextConfig;
