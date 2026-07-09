/**
 * 시대 팩트 — "사주 위에 얹는 세상의 흐름" 데이터.
 *
 * 실데이터는 서울경제 뉴스 검색 API 에서 concern 별로 가져온다(fetchEraFacts).
 * 뉴스 API 는 CORS 로 브라우저 직접 호출을 막으므로(우리 도메인 미허용), chat-bedrock Lambda 의
 * `task:'news'` 프록시를 경유한다. 엔드포인트(NEXT_PUBLIC_CHAT_API_URL) 미설정/실패 시 빈 배열
 * → 호출측이 아래 ERA_FACTS placeholder 로 폴백한다(EraFactCard 가 '예시' 배지 노출).
 */
import type { ConcernId } from './types';

const CHAT_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_API_URL;

export interface EraFact {
  ko: string;
  en: string;
  /** 출처 라벨 — 실데이터면 '서울경제 · 날짜', placeholder 면 '예시 …' */
  source: string;
  sourceEn: string;
  /** 실데이터(기사)면 원문 링크. 없으면 placeholder(예시)로 간주 */
  url?: string;
}

export const ERA_FACTS: Record<ConcernId, EraFact[]> = {
  career: [
    { ko: '30대 직무 전환자 비중이 늘어나는 추세', en: 'Career switching in one’s 30s is trending up', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
    { ko: '첫 직장 평균 근속은 길지 않은 편', en: 'Average tenure at a first job stays short', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
    { ko: '“한 우물”보다 여러 경험을 선호하는 기업이 느는 흐름', en: 'More firms value varied experience over a single track', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
  ],
  money: [
    { ko: '사회초년생의 목돈 형성 기간이 길어지는 흐름', en: 'It takes longer for young adults to build savings', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
    { ko: '“노후 준비가 막막하다”는 응답이 높은 편', en: 'Many feel unprepared for later life', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
  ],
  relationship: [
    { ko: '1인 가구 비중이 꾸준히 늘어나는 흐름', en: 'Single-person households keep rising', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
    { ko: '결혼·연애의 “정해진 시기”에 대한 인식이 옅어지는 추세', en: 'The idea of a “right time” for marriage is fading', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
  ],
  overwhelmed: [
    { ko: '번아웃을 경험했다는 응답이 높게 나타나는 흐름', en: 'Reported burnout runs high', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
    { ko: '“쉬어가는 시기”를 택하는 사람이 느는 추세', en: 'More people choose to take a pause', source: '예시 · 서울경제 데이터 연동 예정', sourceEn: 'Sample · Sedaily data TBD' },
  ],
};

export function eraFactsFor(concern: ConcernId): EraFact[] {
  return ERA_FACTS[concern] ?? [];
}

// ── 서울경제 뉴스 실연동 ──────────────────────────────────────────────

/**
 * concern → 검색 query(단일 키워드) + 점수 가중 키워드.
 * 관련 기사는 경제뿐 아니라 사회 카테고리에도 많아 카테고리는 제한하지 않는다.
 * (API query 는 단일 토큰만 매칭 — 여러 단어를 한 번에 넣으면 0건)
 */
const ERA_QUERY: Record<ConcernId, { query: string; keywords: string[] }> = {
  career: { query: '이직', keywords: ['이직', '취업', '채용', '일자리', '고용', '직장', '커리어', '연봉', '청년', '퇴사'] },
  money: { query: '재테크', keywords: ['재테크', '투자', '금리', '부동산', '노후', '연금', '자산', '저축', '월급', '물가', '대출', '집값'] },
  relationship: { query: '결혼', keywords: ['결혼', '비혼', '혼인', '1인 가구', '1인가구', '연애', '출산', '이혼', '가구', '인구'] },
  overwhelmed: { query: '번아웃', keywords: ['번아웃', '워라밸', '퇴사', '우울', '정신건강', '스트레스', '직장인', '휴식'] },
};

const POOL_SIZE = 15;
const POOL_WINDOW_DAYS = 90;
const PICK = 2;

interface RawArticle {
  title?: string;
  sub_title?: string;
  content?: string;
  published_at?: string;
  original_link?: string;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtKDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 서울경제 경제뉴스에서 concern 과 관련된 최근 기사를 가져와 시대 팩트로 변환.
 * 실패하거나 관련 기사가 없으면 빈 배열 → 호출측이 placeholder 로 폴백.
 */
export async function fetchEraFacts(concern: ConcernId, signal?: AbortSignal): Promise<EraFact[]> {
  const q = ERA_QUERY[concern];
  if (!q || !CHAT_ENDPOINT) return [];
  try {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - POOL_WINDOW_DAYS);
    const until = new Date(now);
    until.setDate(until.getDate() + 1);

    // chat Lambda 의 뉴스 프록시 경유(브라우저 CORS 우회). 서버끼리는 CORS 제한이 없다.
    const res = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'news',
        search: {
          query: q.query, // 단일 키워드로 관련도 검색 (카테고리 제한 없음)
          filters: { categories: [], published_from: fmtDate(from), published_until: fmtDate(until) },
          page: 1,
          page_size: POOL_SIZE,
        },
      }),
      signal,
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const list: RawArticle[] = Array.isArray((data as { articles?: unknown })?.articles)
      ? (data as { articles: RawArticle[] }).articles
      : [];

    // 키워드 매칭 점수 → 관련 기사만(score>0) 점수·최신순으로 PICK 개
    const scored = list
      .map(a => {
        const text = `${a.title ?? ''} ${a.sub_title ?? ''} ${a.content ?? ''}`.toLowerCase();
        const score = q.keywords.reduce((n, k) => (text.includes(k.toLowerCase()) ? n + 1 : n), 0);
        return { a, score };
      })
      .filter(s => s.score > 0 && s.a.title)
      .sort((x, y) => y.score - x.score || (y.a.published_at ?? '').localeCompare(x.a.published_at ?? ''))
      .slice(0, PICK);

    return scored.map(({ a }) => {
      const date = fmtKDate(a.published_at);
      const title = (a.title ?? '').trim();
      return {
        ko: title,
        en: title,
        source: date ? `서울경제 · ${date}` : '서울경제',
        sourceEn: date ? `Sedaily · ${date}` : 'Sedaily',
        url: a.original_link,
      };
    });
  } catch {
    return [];
  }
}
