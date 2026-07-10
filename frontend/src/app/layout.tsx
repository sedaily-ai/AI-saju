import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

// 명패(목재) 타일 갑자 서예체 — /saju/chart 대운·세운·월운 UnCard 전용
const notoSerifKR = Noto_Serif_KR({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-serif-kr",
  display: "swap",
});
import { Providers } from "./providers";
import { GoogleAnalytics } from "@/shared/lib/GoogleAnalytics";
import { ClarityAnalytics } from "@/shared/lib/ClarityAnalytics";
import { TopNav } from "@/shared/ui/TopNav";
import {
  JsonLd,
  siteWebSiteSchema,
  siteOrganizationSchema,
  SITE_URL,
  SITE_NAME_KO,
} from "@/shared/lib/jsonLd";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "사주매칭 — 사주·오늘의 운세·궁합 추천 (무료)",
    template: "%s | 사주매칭",
  },
  description:
    "생년월일 하나로 사주팔자 원국·오늘의 운세·대운·재운·커리어·궁합까지 한 화면에. 궁통보감·삼명통회·자평진전 3대 고전과 KASI 만세력을 결합한 데이터 기반 무료 사주 서비스.",
  applicationName: SITE_NAME_KO,
  keywords: [
    "사주", "사주팔자", "무료사주", "오늘의 운세", "운세", "궁합",
    "사주 궁합", "커플 궁합", "재운", "대운", "세운", "십성",
    "명리학", "만세력", "KASI 만세력", "일간", "오행",
  ],
  authors: [{ name: SITE_NAME_KO, url: SITE_URL }],
  creator: SITE_NAME_KO,
  publisher: SITE_NAME_KO,
  category: "lifestyle",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: {
      "ko-KR": `${SITE_URL}/`,
      en: `${SITE_URL}/`,
    },
  },
  openGraph: {
    title: "사주매칭 — 사주·오늘의 운세·궁합 추천",
    description:
      "생년월일 하나로 원국·대운·재운·커리어·궁합까지. 고전 명리학을 데이터로 다시 읽는 무료 사주 서비스.",
    url: SITE_URL,
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US"],
    siteName: SITE_NAME_KO,
  },
  twitter: {
    card: "summary_large_image",
    title: "사주매칭 — 사주·오늘의 운세·궁합 추천",
    description:
      "생년월일 하나로 원국·대운·재운·커리어·궁합까지. 데이터 기반 무료 사주.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`antialiased ${notoSerifKR.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* phase-03 (2026-05-24): 점신 톤 라이트 단일.
            dark 클래스 절대 추가하지 않음. localStorage 의 옛 'theme=dark' 도 정리.
            (ThemeToggle UI 는 phase-04 에서 제거 예정 — 일단 클릭해도 시각 변화 없음) */}
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={{
          background: 'var(--saju-paper)',
          color: 'var(--saju-ink)',
          colorScheme: 'light',
        }}
      >
        <Script
          id="remove-dark-mode"
          strategy="beforeInteractive"
        >{`(function(){try{document.documentElement.classList.remove('dark');if(localStorage.getItem('theme')==='dark'){localStorage.removeItem('theme')}}catch(e){}})();`}</Script>
        <JsonLd data={siteWebSiteSchema()} />
        <JsonLd data={siteOrganizationSchema()} />
        <Providers>
          <a href="#main-content" className="skip-link">
            본문 바로가기
          </a>
          <TopNav />
          {children}
          <footer className="mt-auto py-4 text-center text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            Copyright ⓒ Sedaily, All right reserved
          </footer>
        </Providers>
        <GoogleAnalytics />
        <ClarityAnalytics />
      </body>
    </html>
  );
}
