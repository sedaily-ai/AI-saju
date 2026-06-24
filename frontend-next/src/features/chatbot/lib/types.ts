import type { Pillar, DaeunEntry } from '@/features/fortune/lib/engine';

export type ChatRole = 'bot' | 'user';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** react-markdown 으로 렌더할지 여부 (봇 해석 답변) */
  markdown?: boolean;
}

/** 대화 단계 — 수집(date~region) → 주제 메뉴(menu) */
export type StepId = 'greeting' | 'date' | 'time' | 'gender' | 'region' | 'menu';

/** 메뉴에서 고를 수 있는 사주 주제 */
export type TopicId =
  | 'chongun'      // 내 성향(총운)
  | 'strengths'    // 강점·약점
  | 'jobs'         // 어울리는 직업
  | 'ilju'         // 일주 풀이
  | 'ohaeng'       // 오행 균형
  | 'singangyak'   // 신강·신약
  | 'yongsin'      // 용신(보완 기운)
  | 'today'        // 오늘의 운세
  | 'daeun'        // 대운 흐름
  | 'restart';     // 처음부터

export interface DraftInput {
  y?: number;
  m?: number;
  d?: number;
  /** 시(0~23). undefined 면 시간 모름 */
  hour?: number;
  min?: number;
  noTime?: boolean;
  gender?: '남' | '여';
  /** 경도 문자열 ('' = 보정 안함) */
  region?: string;
}

export interface ChatState {
  step: StepId;
  draft: DraftInput;
  pillars: Pillar[] | null;
  ilgan: string;
  daeuns: DaeunEntry[];
}

/** quick-reply 버튼 한 개 */
export interface QuickReply {
  /** 핸들러에 전달될 값 */
  value: string;
  /** 버튼에 보일 라벨 */
  label: string;
}
