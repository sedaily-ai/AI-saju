/**
 * 시대 팩트 — "사주 위에 얹는 세상의 흐름" 데이터.
 *
 * ⚠️ 여기 수치는 전부 **예시(placeholder)** 다. 서울경제 이름으로 나가는 서비스이므로
 *    실제 통계는 임의로 지어내지 않는다. 화면(EraFactCard)에 "예시" 배지를 노출하고,
 *    추후 서울경제 데이터/뉴스 API 응답으로 이 데이터셋을 **교체**한다.
 *
 * TODO: fetchEraFacts(concern) 를 서울경제 API 연동으로 구현해 ERA_FACTS 를 대체.
 */
import type { ConcernId } from './types';

export interface EraFact {
  ko: string;
  en: string;
  /** 출처 — 실데이터 연동 시 기사/통계 출처로 교체 */
  source: string;
  sourceEn: string;
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
