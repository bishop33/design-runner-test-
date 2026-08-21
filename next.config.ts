import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // OG 이미지 렌더링용 한글 폰트가 서버리스 번들에 포함되도록 명시
  outputFileTracingIncludes: {
    '/api/og': ['./src/app/api/og/*.woff'],
  },
}

export default nextConfig
