/**
 * 주제(TopicId) → 사주 해석 말풍선 생성.
 * 기존 fortune 엔진 결과 + 미리 만든 해석 캐시(chongun.json)를
 * 대화체 텍스트로 재구성한다 (실시간 LLM 없음).
 */
import {
  buildChongun,
  buildTodayFortune,
  calculateElementDistribution,
  judgeSinGangYak,
  suggestYongsin,
  detectGyeokguk,
  OH_HJ,
  type Pillar,
  type DaeunEntry,
} from '@/features/fortune/lib/engine';
import type { TopicId } from './types';

type T = (ko: string, en: string) => string;

/** chongun.json: { "丙_寅_卯": { NF: "마크다운..", ... }, ... } */
export type ChongunCache = Record<string, Partial<Record<'NT' | 'NF' | 'ST' | 'SF', string>>>;

export interface AnswerContext {
  pillars: Pillar[];
  daeuns: DaeunEntry[];
  birthYear: number;
  /** 미리 로드된 chongun 해석 캐시 (없으면 엔진 기본값으로 폴백) */
  chongunCache?: ChongunCache | null;
}

const ohHanja = (oh: string) => (oh ? `${oh}(${OH_HJ[oh] ?? ''})` : '');

/** 챗봇 기본 해석 톤 — NF(이야기꾼): 가장 따뜻하고 대화체에 어울림 */
const CHAT_TONE: 'NT' | 'NF' | 'ST' | 'SF' = 'NF';

function cacheKey(ps: Pillar[]): string {
  return `${ps[1].c}_${ps[1].j}_${ps[2].j}`;
}

// ── 주제별 답변 ──

function chongunAnswer(ctx: AnswerContext, t: T): string[] {
  const ps = ctx.pillars;
  const c = buildChongun(ps);
  if (!c) return [t('총운 정보를 불러오지 못했어요.', 'Could not load your nature reading.')];

  const out: string[] = [];
  out.push(
    t(
      `먼저 당신의 중심 기운부터 볼게요. 일간은 **${c.element}(${OH_HJ[c.element] ?? ''})**, 상징하면 **${c.symbol}** 같은 기운이에요.`,
      `Let's start with your core. Your Day Master is **${c.element}(${OH_HJ[c.element] ?? ''})** — like **${c.symbol}**.`,
    ),
  );
  out.push(`${c.nature}`);
  if (c.keywords?.length) {
    out.push(
      t(
        `한 마디로 요약하면 ${c.keywords.map(k => `\`${k}\``).join(' · ')} — 이런 결을 가진 분이에요.`,
        `In a word: ${c.keywords.map(k => `\`${k}\``).join(' · ')}.`,
      ),
    );
  }

  // 미리 만든 해석 캐시(NF 톤)가 있으면 깊이 있는 풀이를 덧붙임
  const cached = ctx.chongunCache?.[cacheKey(ps)]?.[CHAT_TONE];
  if (cached) {
    out.push(cached);
  } else if (c.detail?.summary) {
    out.push(c.detail.summary);
  }
  return out;
}

function strengthsAnswer(ctx: AnswerContext, t: T): string[] {
  const c = buildChongun(ctx.pillars);
  if (!c?.detail) return [t('강점·약점 정보를 불러오지 못했어요.', 'Could not load strengths & weaknesses.')];
  const out: string[] = [];
  if (c.detail.strengths?.length) {
    out.push(
      `**${t('이런 점이 강점이에요 💪', 'Your strengths 💪')}**\n` +
        c.detail.strengths.map(s => `- ${s}`).join('\n'),
    );
  }
  if (c.detail.weaknesses?.length) {
    out.push(
      `**${t('이런 점은 조심하면 좋아요', 'Watch out for')}**\n` +
        c.detail.weaknesses.map(s => `- ${s}`).join('\n'),
    );
  }
  if (c.detail.improvement) {
    out.push(t(`💡 ${c.detail.improvement}`, `💡 ${c.detail.improvement}`));
  }
  return out.length ? out : [t('강점·약점 정보가 충분하지 않아요.', 'Not enough data for this.')];
}

function jobsAnswer(ctx: AnswerContext, t: T): string[] {
  const c = buildChongun(ctx.pillars);
  if (!c?.detail?.jobs?.length) return [t('직업 추천 정보를 불러오지 못했어요.', 'Could not load career suggestions.')];
  const out: string[] = [];
  out.push(t('타고난 기질로 보면, 이런 일과 잘 맞아요.', 'Given your nature, these paths suit you well.'));
  out.push(
    c.detail.jobs
      .map(j => `**${j.field} · ${j.role}**\n${j.reason}`)
      .join('\n\n'),
  );
  return out;
}

function iljuAnswer(ctx: AnswerContext, t: T): string[] {
  const c = buildChongun(ctx.pillars);
  if (!c) return [t('일주 풀이를 불러오지 못했어요.', 'Could not load your day-pillar reading.')];
  const out: string[] = [];
  if (c.iljuReading) out.push(c.iljuReading);
  if (c.iljiDetail?.summary) out.push(c.iljiDetail.summary);
  if (c.iljiDetail?.conclusion) out.push(c.iljiDetail.conclusion);
  if (c.seasonRelation) {
    out.push(
      t(`태어난 계절(${c.season?.name ?? ''})과의 관계로 보면, ${c.seasonRelation}`,
        `By your birth season (${c.season?.name ?? ''}): ${c.seasonRelation}`),
    );
  }
  return out.length ? out : [t('일주 풀이 정보가 충분하지 않아요.', 'Not enough data for this.')];
}

function ohaengAnswer(ctx: AnswerContext, t: T): string[] {
  const dist = calculateElementDistribution(ctx.pillars);
  const out: string[] = [];
  const line = (['목', '화', '토', '금', '수'] as const)
    .map(o => `${ohHanja(o)} ${dist.counts[o]}`)
    .join(' · ');
  out.push(t(`당신의 오행 분포는 이래요.\n${line}`, `Here's your Five-Element spread.\n${line}`));
  if (dist.excess.length) {
    out.push(
      t(
        `**${dist.excess.map(ohHanja).join(', ')}** 기운이 강하게 작용해요. 이 기운의 장점은 살리되, 너무 한쪽으로 치우치지 않게 균형을 잡는 게 좋아요.`,
        `**${dist.excess.map(ohHanja).join(', ')}** runs strong — lean into its upside but keep it balanced.`,
      ),
    );
  }
  if (dist.lacking.length) {
    out.push(
      t(
        `반대로 **${dist.lacking.map(ohHanja).join(', ')}** 기운은 비어 있어요. 이 기운과 관련된 활동·색·방향을 가까이하면 보완에 도움이 돼요.`,
        `On the other hand **${dist.lacking.map(ohHanja).join(', ')}** is missing — bringing in related activities or colors helps.`,
      ),
    );
  }
  if (!dist.excess.length && !dist.lacking.length) {
    out.push(t('오행이 비교적 고르게 퍼져 있어서, 균형 감각이 좋은 사주예요. 👍', 'Your elements are evenly spread — a nicely balanced chart. 👍'));
  }
  return out;
}

function singangyakAnswer(ctx: AnswerContext, t: T): string[] {
  const s = judgeSinGangYak(ctx.pillars);
  if (!s) return [t('신강·신약을 판정하지 못했어요.', 'Could not judge strength.')];
  const g = detectGyeokguk(ctx.pillars);
  const out: string[] = [];
  out.push(
    t(
      `당신의 사주는 **${s.level}** 이에요. (종합 점수 ${s.score}/100)`,
      `Your chart is **${s.level}** (score ${s.score}/100).`,
    ),
  );
  out.push(
    t(
      `득령(월지) ${s.deukryeong ? '✅' : '❌'} · 득지(일지) ${s.deukji ? '✅' : '❌'} · 주변 도움 ${s.deukse}자 — 이 세 가지를 종합한 결과예요.`,
      `Month branch ${s.deukryeong ? '✅' : '❌'} · Day branch ${s.deukji ? '✅' : '❌'} · Support ${s.deukse} — combined into the result above.`,
    ),
  );
  out.push(
    s.score >= 60
      ? t('기운이 꽤 단단한 편이에요. 가진 힘을 밖으로 풀어내는 도전·표현 활동이 잘 맞아요.', 'Your energy is solid — challenges and self-expression suit you.')
      : s.score <= 40
        ? t('기운이 여린 편이에요. 무리하기보다 도움을 받고 차곡차곡 채우는 전략이 훨씬 잘 맞아요.', 'Your energy is gentler — replenishing strategies beat pushing hard.')
        : t('기운이 한쪽으로 치우치지 않은 중화 사주예요. 상황에 유연하게 대응할 수 있는 편이에요.', 'Balanced (中和) — you adapt flexibly to circumstances.'),
  );
  if (g) out.push(t(`참고로 격국은 **${g.name}** — ${g.description}`, `Your structure: **${g.name}** — ${g.description}`));
  return out;
}

function yongsinAnswer(ctx: AnswerContext, t: T): string[] {
  const sgy = judgeSinGangYak(ctx.pillars);
  const dist = calculateElementDistribution(ctx.pillars);
  if (!sgy) return [t('용신을 추천하지 못했어요.', 'Could not suggest a useful element.')];
  const y = suggestYongsin(ctx.pillars, sgy, dist);
  if (!y) return [t('용신을 추천하지 못했어요.', 'Could not suggest a useful element.')];
  const out: string[] = [];
  out.push(
    t(
      `당신에게 가장 도움이 되는 기운(용신)은 **${ohHanja(y.primary)}** 예요.`,
      `Your most useful element is **${ohHanja(y.primary)}**.`,
    ),
  );
  out.push(y.description);
  if (y.supportElements.length) {
    out.push(
      t(
        `함께 챙기면 좋은 보조 기운(희신)은 ${y.supportElements.map(ohHanja).join(', ')} 이에요.`,
        `Supporting elements to lean on: ${y.supportElements.map(ohHanja).join(', ')}.`,
      ),
    );
  }
  return out;
}

function todayAnswer(ctx: AnswerContext, t: T): string[] {
  const today = buildTodayFortune(ctx.pillars);
  if (!today) return [t('오늘의 운세를 불러오지 못했어요.', "Could not load today's fortune.")];
  const out: string[] = [];
  out.push(
    t(
      `오늘의 일진은 **${today.dayPillar}(${today.dayPillarHanja})** 이에요. 당신의 일간과 만나는 기운으로 풀어볼게요.`,
      `Today's pillar is **${today.dayPillar}(${today.dayPillarHanja})**. Here's how it meets your Day Master.`,
    ),
  );
  if (today.ssReading) out.push(`**${today.ss}** — ${today.ssReading}`);
  if (today.usReading) out.push(`**${today.us}** — ${today.usReading}`);
  const top = [...today.categories].sort((a, b) => b.score - a.score);
  if (top.length) {
    out.push(
      `**${t('오늘 분야별 운', "Today's areas")}**\n` +
        top.map(c => `- ${c.label} · ${c.score}점`).join('\n'),
    );
  }
  if (today.sinsal?.length) {
    out.push(
      t(`오늘 작용하는 신살: ${today.sinsal.map(s => s.name).join(', ')}`,
        `Spirits at play today: ${today.sinsal.map(s => s.name).join(', ')}`),
    );
  }
  return out;
}

function daeunAnswer(ctx: AnswerContext, t: T): string[] {
  const { daeuns, birthYear } = ctx;
  if (!daeuns?.length) return [t('대운 정보를 불러오지 못했어요.', 'Could not load your luck cycles.')];
  const age = new Date().getFullYear() - birthYear + 1; // 한국식 나이 근사
  const current = [...daeuns].reverse().find(d => d.age <= age) ?? daeuns[0];
  const out: string[] = [];
  out.push(
    t(
      `대운은 10년 단위로 흐르는 큰 운의 물결이에요. 지금은 **${current.age}세 대운**(${current.ck}${current.jk} · ${current.c}${current.j}) 한가운데에 있어요.`,
      `Luck cycles flow in 10-year waves. You're in the **age-${current.age} cycle** (${current.c}${current.j}).`,
    ),
  );
  const upcoming = daeuns.filter(d => d.age > age).slice(0, 3);
  if (upcoming.length) {
    out.push(
      `**${t('앞으로 다가올 대운', 'Cycles ahead')}**\n` +
        upcoming.map(d => `- ${d.age}${t('세', 'y')} · ${d.ck}${d.jk}(${d.c}${d.j})`).join('\n'),
    );
  }
  return out;
}

export function buildAnswer(topic: TopicId, ctx: AnswerContext, t: T): string[] {
  switch (topic) {
    case 'chongun': return chongunAnswer(ctx, t);
    case 'strengths': return strengthsAnswer(ctx, t);
    case 'jobs': return jobsAnswer(ctx, t);
    case 'ilju': return iljuAnswer(ctx, t);
    case 'ohaeng': return ohaengAnswer(ctx, t);
    case 'singangyak': return singangyakAnswer(ctx, t);
    case 'yongsin': return yongsinAnswer(ctx, t);
    case 'today': return todayAnswer(ctx, t);
    case 'daeun': return daeunAnswer(ctx, t);
    default: return [];
  }
}

/** 답변 뒤에 이어 붙일 따뜻한 후속 제안 (주제별로 관련 주제 추천) */
export function followUp(topic: TopicId, t: T): string {
  switch (topic) {
    case 'chongun':
      return t('강점·약점이나 어울리는 직업도 궁금하면 이어서 물어보세요. 🙂', 'Curious about your strengths or fitting careers? Just ask. 🙂');
    case 'strengths':
      return t('이 기질이 어떤 일과 맞는지 「어울리는 직업」에서 더 볼 수 있어요.', 'See how this fits work under "Careers".');
    case 'jobs':
      return t('타고난 결이 더 궁금하면 「내 성향」이나 「일주 풀이」도 보세요.', 'Want more on your nature? Try "My nature" or "Day pillar".');
    case 'ohaeng':
      return t('비거나 넘치는 기운을 어떻게 채울지 「용신(보완 기운)」에서 이어집니다.', 'How to balance it? Continue with "Useful element".');
    case 'singangyak':
      return t('그래서 무엇을 채우면 좋은지 「용신」에서 바로 이어볼까요?', 'What to supplement? Continue with "Useful element".');
    case 'yongsin':
      return t('지금 시기의 흐름은 「대운 흐름」에서 볼 수 있어요.', 'For your current era, see "Luck cycles".');
    case 'today':
      return t('오늘 말고 큰 흐름이 궁금하면 「대운 흐름」을 눌러보세요.', 'For the bigger picture, try "Luck cycles".');
    case 'daeun':
      return t('타고난 성향과 함께 보면 더 입체적이에요. 「내 성향」도 보실래요?', 'Pairs well with "My nature" for the full picture.');
    default:
      return t('더 궁금한 게 있나요?', 'Anything else?');
  }
}

export interface TopicMeta { id: TopicId; ko: string; en: string }

/** 메뉴에 노출할 주제 목록 — 사용자가 말하듯 문장형으로 (restart 포함) */
export const TOPICS: TopicMeta[] = [
  { id: 'chongun', ko: '내 성향이 궁금해요', en: 'What am I like?' },
  { id: 'strengths', ko: '내 강점과 약점은?', en: 'My strengths & weaknesses?' },
  { id: 'jobs', ko: '어떤 직업이 어울려요?', en: 'What careers suit me?' },
  { id: 'ilju', ko: '일주 풀이가 보고 싶어요', en: 'Tell me about my day pillar' },
  { id: 'ohaeng', ko: '내 오행 균형은 어때요?', en: "How's my element balance?" },
  { id: 'singangyak', ko: '나는 신강일까 신약일까?', en: 'Am I strong or weak?' },
  { id: 'yongsin', ko: '어떤 기운을 채우면 좋아요?', en: 'Which element should I boost?' },
  { id: 'today', ko: '오늘 운세는 어때요?', en: "How's my day today?" },
  { id: 'daeun', ko: '지금 대운 흐름이 궁금해요', en: "What's my luck cycle now?" },
  { id: 'restart', ko: '처음부터 다시 할래요', en: 'Start over' },
];
