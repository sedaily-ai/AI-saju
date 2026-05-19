import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { GoogleAnalytics } from "@/shared/lib/GoogleAnalytics";
import { ClarityAnalytics } from "@/shared/lib/ClarityAnalytics";
import { LangToggle } from "@/shared/lib/LangToggle";
import { ThemeToggle } from "@/shared/lib/ThemeToggle";
import { BackButton } from "@/shared/ui/BackButton";
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
    <html lang="ko" className="antialiased" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* FOUC 방지: 페이지 렌더 전에 테마 즉시 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){try{
                var t=localStorage.getItem('theme');
                if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
                if(t==='dark'){document.documentElement.classList.add('dark');}
              }catch(e){}})();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <JsonLd data={siteWebSiteSchema()} />
        <JsonLd data={siteOrganizationSchema()} />
        <Providers>
          <a href="#main-content" className="skip-link">
            본문 바로가기
          </a>
          {/* 모든 페이지 공통 — 좌상단 뒤로가기 (랜딩 제외) */}
          <BackButton />
          {/* 모든 페이지 공통 — 우상단 고정 토글 바 */}
          <div
            className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 rounded-full px-2 py-1.5"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 6px 18px -8px rgba(17,17,17,0.18)',
              border: '1px solid rgba(17,17,17,0.06)',
            }}
          >
            <LangToggle />
            <ThemeToggle />
          </div>
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
