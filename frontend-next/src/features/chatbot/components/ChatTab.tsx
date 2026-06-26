'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/shared/lib/LangContext';
import { SAJU } from '@/shared/ui/sajuTokens';
import { ChatBubble } from './ChatBubble';
import { QuickReplies } from './QuickReplies';
import { EraFactCard } from './EraFactCard';
import { DateSelect, TimeSelect, RegionSelect } from './BirthPicker';
import { computeSaju, loadSavedDraft } from '../lib/chatFlow';
import { buildSajuContext, narrowCount, remainingConcerns } from '../lib/knotMachine';
import { CONCERNS, CONCERN_MAP, routeFreeText } from '../lib/concerns';
import { initialPredict, knotHit } from '../lib/coldReading';
import { buildOverlay, buildKnot } from '../lib/narrative';
import { eraFactsFor } from '../lib/eraFacts';
import { callLlm, llmEnabled, type LlmTask } from '../lib/llm';
import type {
  ChatMessage, ChatState, ConcernId, DraftInput, LangText, QuickReply,
} from '../lib/types';
import type { Pillar, DaeunEntry } from '@/features/fortune/lib/engine';

const INITIAL: ChatState = {
  step: 'greeting', draft: {}, pillars: null, ilgan: '', daeuns: [],
  saju: null, knot: null, raisedConcerns: [],
};

// 입력 전 '왜 4기둥이 필요한지' 설명
const EXPLAIN_PILLARS: LangText[] = [
  { ko: '사주(四柱)는 말 그대로 기둥 4개 — 태어난 연·월·일·시예요.', en: "'Saju' (四柱) literally means four pillars: the year, month, day, and hour you were born." },
  { ko: '이 넷이 당신 에너지의 설계도라, 점이 아니라 ‘근거’로 읽어드릴 수 있어요. 그래서 생년월일과 시간이 필요해요.', en: "These four are the blueprint of your energy — so I can read with grounds, not guesswork. That's why I need your birth date and time." },
];

export function ChatTab() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState<ChatState>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [timeTextMode, setTimeTextMode] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [freeText, setFreeText] = useState('');
  // 현재 말풍선이 타이핑되는 중인지 (true 면 '입력 중' 점은 숨김)
  const [isTyping, setIsTyping] = useState(false);

  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetedRef = useRef(false);
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  // 현재 타이핑 중인 말풍선이 끝나면 호출되는 resolver (다음 말풍선 대기용)
  const typedResolverRef = useRef<(() => void) | null>(null);
  const nextId = () => `m${idRef.current++}`;

  const toStr = useCallback((l: LangText) => t(l.ko, l.en), [t]);

  /** 말풍선이 다 표시되면 ChatBubble 이 호출 → 대기 중인 다음 말풍선을 진행시킴 */
  const handleBubbleTyped = useCallback(() => {
    setIsTyping(false);
    const r = typedResolverRef.current;
    typedResolverRef.current = null;
    r?.();
  }, []);

  // ── 말풍선 헬퍼 ──
  const pushUser = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: nextId(), role: 'user', text }]);
  }, []);

  /** 봇 말풍선을 하나씩 — 앞 말풍선이 '완전히 표시된 뒤'에야 다음을 올린다. */
  const pushBot = useCallback(async (texts: string[], markdown: boolean): Promise<void> => {
    if (!texts.length) return;
    setBusy(true);
    for (let i = 0; i < texts.length; i++) {
      // 다음 말풍선 직전 짧은 '입력 중' 간격
      await new Promise<void>(r => window.setTimeout(r, i === 0 ? 500 : 350));
      // 말풍선을 올리고, 그 말풍선이 다 표시될 때까지(onTyped) 대기
      await new Promise<void>(done => {
        typedResolverRef.current = done;
        setIsTyping(true);
        setMessages(prev => [...prev, { id: nextId(), role: 'bot', text: texts[i], markdown }]);
      });
    }
    setBusy(false);
  }, []);

  const say = useCallback((lines: LangText[], markdown = false) =>
    pushBot(lines.map(toStr), markdown), [pushBot, toStr]);

  /** LLM 이 연결돼 있으면 그 서술을, 아니면 템플릿(fallback)을 말풍선으로 출력.
   *  state 업데이트는 비동기라 concern/narrowAnswers 는 명시적으로 받는다. */
  const sayLlmOr = useCallback(async (
    task: LlmTask,
    fallback: LangText[],
    opts?: { concern?: ConcernId; narrowAnswers?: string[] },
  ) => {
    if (llmEnabled() && chatRef.current.saju) {
      setBusy(true); // LLM 왕복 동안 '입력 중' 표시
      const concern = opts?.concern ?? chatRef.current.knot?.concern;
      const text = await callLlm({
        task,
        lang,
        saju: chatRef.current.saju,
        concern,
        narrowAnswers: opts?.narrowAnswers ?? chatRef.current.knot?.narrowAnswers,
        prior: chatRef.current.raisedConcerns,
        eraFacts: concern
          ? eraFactsFor(concern).map(f => ({ text: lang === 'en' ? f.en : f.ko, source: lang === 'en' ? f.sourceEn : f.source }))
          : undefined,
      });
      if (text) { await pushBot([text], true); return; }
    }
    await pushBot(fallback.map(toStr), true);
  }, [lang, pushBot, toStr]);

  const pushEra = useCallback((concern: ConcernId) => new Promise<void>(resolve => {
    setBusy(true);
    window.setTimeout(() => {
      setMessages(prev => [...prev, { id: nextId(), role: 'bot', text: '', era: concern }]);
      setBusy(false);
      resolve();
    }, 600);
  }), []);

  // 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, 140);
    return () => window.clearInterval(id);
  }, [busy]);

  // ── 맞히기(초기) 시퀀스 — LLM 있으면 매번 다르게, 없으면 템플릿 ──
  const runPredict = useCallback(async (saju: ChatState['saju']) => {
    if (!saju) return;
    await say([{ ko: '네 기둥이 모였어요. 풀이 전에, 제가 먼저 맞혀볼게요 👀', en: "Your four pillars are in. Before I read — let me guess first 👀" }]);
    let text: string | null = null;
    if (llmEnabled()) { setBusy(true); text = await callLlm({ task: 'predict', lang, saju }); }
    await pushBot([text ?? initialPredict(saju).map(toStr).join('\n\n')], true);
    setChat(c => ({ ...c, step: 'predict' }));
  }, [say, pushBot, toStr, lang]);

  // ── 원국 계산 후 맞히기로 ──
  const computeAndPredict = useCallback(async (
    draft: DraftInput, pillars: Pillar[], ilgan: string, daeuns: DaeunEntry[],
  ) => {
    const saju = buildSajuContext(pillars, daeuns, draft.y ?? new Date().getFullYear());
    setChat(c => ({ ...c, draft, pillars, ilgan, daeuns, saju, step: 'predict' }));
    await runPredict(saju);
  }, [runPredict]);

  // ── 초기 인사 (1회) ──
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const saved = loadSavedDraft();
    setHasSaved(!!saved);
    (async () => {
      await say([
        { ko: '안녕하세요. 🔮', en: 'Hello. 🔮' },
        { ko: '당신 사주에 지금 세상이 어떻게 흐르는지를 얹어서 같이 읽어드려요.', en: "I lay how the world is moving right now on top of your saju, and read them together." },
      ]);
      if (saved) {
        const d = saved.draft;
        const info = d.y != null ? `${d.y}/${String(d.m).padStart(2, '0')}/${String(d.d).padStart(2, '0')}` : '';
        await say([{ ko: `이전에 본 사주(${info})가 있어요. 이어서 볼까요, 새로 할까요?`, en: `You have a past reading (${info}). Continue, or start fresh?` }]);
      } else {
        await say(EXPLAIN_PILLARS);
        await say([{ ko: '그럼 하나씩 같이 세워볼게요. 먼저 태어난 날(양력)을 골라주세요.', en: "Let's build them one by one. First, pick your birth date (solar)." }]);
        setChat(c => ({ ...c, step: 'date' }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 입력 단계 핸들러 ──
  const acceptDate = useCallback(async (y: number, m: number, d: number) => {
    if (busy) return;
    pushUser(`${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`);
    setChat(c => ({ ...c, draft: { ...c.draft, y, m, d }, step: 'time' }));
    await say([{ ko: '좋아요, 연·월·일 세 기둥이 섰어요! 시간까지 알면 네 번째 기둥(시주)이 완성돼요. 태어난 시간 아시나요?', en: 'Great — the year, month, and day pillars are up! The birth time completes the fourth pillar. Do you know it?' }]);
  }, [busy, pushUser, say]);

  const acceptTime = useCallback(async (hour: number, min: number) => {
    if (busy) return;
    pushUser(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    setTimeTextMode(false);
    setChat(c => ({ ...c, draft: { ...c.draft, hour, min, noTime: false }, step: 'gender' }));
    await say([{ ko: '성별도 알려주실래요? 대운 방향을 정하는 데 필요해요.', en: 'Your gender? It sets the direction of your luck cycles.' }]);
  }, [busy, pushUser, say]);

  const acceptRegion = useCallback(async (value: string, label: string) => {
    if (busy) return;
    pushUser(label);
    const draft = { ...chatRef.current.draft, region: value };
    const res = computeSaju(draft);
    if (!res) {
      await say([{ ko: '사주를 계산하지 못했어요. 처음부터 다시 해볼까요?', en: 'Could not compute. Restart?' }]);
      setChat({ ...INITIAL, step: 'date' });
      return;
    }
    await computeAndPredict(draft, res.pillars, res.ilgan, res.daeuns);
  }, [busy, pushUser, say, computeAndPredict]);

  // ── 매듭 시작 ──
  const startKnot = useCallback(async (concern: ConcernId) => {
    setChat(c => ({ ...c, knot: { concern, narrowStep: 0, narrowAnswers: [] } }));
    const def = CONCERN_MAP[concern];
    if (def.narrow.length > 0) {
      setChat(c => ({ ...c, step: 'narrow' }));
      await say([def.narrow[0].prompt]);
    } else {
      // 좁히기 없음 → 바로 맞히기
      setChat(c => ({ ...c, step: 'hit' }));
      await sayLlmOr('hit', [knotHit(concern, [], chatRef.current.saju!)], { concern, narrowAnswers: [] });
    }
  }, [say, sayLlmOr]);

  // ── 매듭 꼬리: 얹기 → 시대 팩트 → 매듭짓기 → 잇기 ──
  const runKnotTail = useCallback(async (concern: ConcernId) => {
    const saju = chatRef.current.saju!;
    const prior = chatRef.current.raisedConcerns;
    const narrowAnswers = chatRef.current.knot?.narrowAnswers;
    await sayLlmOr('overlay', buildOverlay(concern, saju), { concern, narrowAnswers });
    await pushEra(concern);
    await sayLlmOr('knot', buildKnot(concern, saju, prior), { concern, narrowAnswers });

    const nextRaised = [...prior, concern];
    setChat(c => ({ ...c, raisedConcerns: nextRaised, knot: null, step: 'link' }));

    const rem = remainingConcerns(nextRaised);
    if (rem.length) {
      await say([{ ko: '이건 좀 풀렸어요? 보통 이런 분들, 그 밑에 딴 게 같이 깔려 있더라고요. 또 있어요?', en: "Eased a bit? Often there's something else underneath. Anything more?" }]);
    } else {
      await say([{ ko: '오늘 꺼낸 고민은 다 짚어봤어요. 또 마음 복잡할 때 들러요.', en: "We've covered today's worries. Come back whenever your mind is busy." }]);
      setChat(c => ({ ...c, step: 'greeting' })); // 종료 상태(선택지 없음)
    }
  }, [say, sayLlmOr, pushEra]);

  // ── quick-reply 처리 ──
  const handlePick = useCallback(async (reply: QuickReply) => {
    if (busy) return;
    const { step } = chatRef.current;

    if (step === 'greeting') {
      pushUser(reply.label);
      if (reply.value === 'continue') {
        const saved = loadSavedDraft();
        if (saved) {
          await computeAndPredict(saved.draft, saved.pillars, saved.ilgan, saved.daeuns);
          return;
        }
      }
      setChat({ ...INITIAL, step: 'date' });
      await say(EXPLAIN_PILLARS);
      await say([{ ko: '좋아요, 새로 볼게요! 먼저 태어난 날(양력)을 골라주세요.', en: "Sure, fresh start! First, pick your birth date (solar) below." }]);
      return;
    }

    if (step === 'time') {
      pushUser(reply.label);
      if (reply.value === 'input') {
        setTimeTextMode(true);
        await say([{ ko: '아래에서 태어난 시각을 골라주세요.', en: 'Pick your birth time below.' }]);
        return;
      }
      setChat(c => ({ ...c, draft: { ...c.draft, noTime: true, hour: undefined, min: undefined }, step: 'gender' }));
      await say([{ ko: '성별도 알려주실래요? 대운 방향을 정하는 데 필요해요.', en: 'Your gender? It sets the direction of your luck cycles.' }]);
      return;
    }

    if (step === 'gender') {
      pushUser(reply.label);
      setChat(c => ({ ...c, draft: { ...c.draft, gender: reply.value as '남' | '여' }, step: 'region' }));
      await say([{ ko: '마지막이에요! 태어난 지역을 골라주세요. 진태양시 보정에 쓰여요.', en: 'Last one! Pick your birth region — used for true-solar-time correction.' }]);
      return;
    }

    if (step === 'predict') {
      pushUser(reply.label);
      const ack: LangText =
        reply.value === 'yes' ? { ko: '그쵸. 사주에 그렇게 나와 있어요.', en: "Right. It's written in your chart." }
        : reply.value === 'half' ? { ko: '반반이면 충분해요. 사주는 정답이 아니라 경향이니까요.', en: 'Half is plenty — saju is a tendency, not a verdict.' }
        : { ko: '그럴 수도 있어요. 그럼 더 정확히 맞춰볼게요.', en: "Could be. Then let me aim more precisely." };
      await say([ack]);
      await say([{ ko: '이제 제대로 볼게요. 요즘 제일 마음 쓰이는 거, 뭐예요?', en: "Now the real read. What's weighing on you most these days?" }]);
      setChat(c => ({ ...c, step: 'concern' }));
      return;
    }

    if (step === 'concern') {
      pushUser(reply.label);
      await startKnot(reply.value as ConcernId);
      return;
    }

    if (step === 'narrow') {
      pushUser(reply.label);
      const k = chatRef.current.knot;
      if (!k) return;
      const answers = [...k.narrowAnswers, reply.value];
      const nextStep = k.narrowStep + 1;
      if (nextStep < narrowCount(k.concern)) {
        setChat(c => ({ ...c, knot: { ...k, narrowStep: nextStep, narrowAnswers: answers } }));
        await say([CONCERN_MAP[k.concern].narrow[nextStep].prompt]);
      } else {
        setChat(c => ({ ...c, knot: { ...k, narrowAnswers: answers }, step: 'hit' }));
        await sayLlmOr('hit', [knotHit(k.concern, answers, chatRef.current.saju!)], { concern: k.concern, narrowAnswers: answers });
      }
      return;
    }

    if (step === 'hit') {
      pushUser(reply.label);
      const k = chatRef.current.knot;
      if (k) await runKnotTail(k.concern);
      return;
    }

    if (step === 'link') {
      pushUser(reply.label);
      if (reply.value === 'done') {
        await say([{ ko: '좋아요. 오늘은 여기까지 — 또 들러요. 🙂', en: "Good. That's it for today — come back anytime. 🙂" }]);
        setChat(c => ({ ...c, step: 'greeting' }));
        return;
      }
      await startKnot(reply.value as ConcernId);
      return;
    }
  }, [busy, pushUser, say, sayLlmOr, computeAndPredict, startKnot, runKnotTail]);

  // ── 자유 입력 — 입력한 질문 '그 자체'에 답한다 (버킷 강제분류 X) ──
  const submitFreeConcern = useCallback(async () => {
    if (busy) return;
    const v = freeText.trim();
    if (!v) return;
    pushUser(v);
    setFreeText('');
    const saju = chatRef.current.saju;

    // LLM 연결 시: 질문 자체에 사주×시대를 얹어 직접 답하고, 다시 잇기 단계로
    if (llmEnabled() && saju) {
      setBusy(true);
      // 직전 대화(텍스트 메시지)를 같이 넘겨 맥락 유지 — 마지막 6턴
      const history = messagesRef.current
        .filter(m => m.text && !m.era)
        .slice(-6)
        .map(m => ({ role: m.role, text: m.text }));
      const text = await callLlm({ task: 'freeform', lang, saju, userText: v, prior: chatRef.current.raisedConcerns, history });
      if (text) {
        await pushBot([text], true);
        setChat(c => ({ ...c, step: 'link' }));
        await say([{ ko: '더 궁금한 게 있으면 적어주셔도 되고, 아래에서 골라도 돼요.', en: 'Ask anything else, or pick from below.' }]);
        return;
      }
    }
    // 폴백(LLM 없음/실패): 키워드로 가까운 버킷 매칭 → 구조화 매듭, 아니면 안내
    const routed = routeFreeText(v);
    if (routed) await startKnot(routed);
    else await say([{ ko: '음, 아래에서 가까운 걸 골라주실래요?', en: 'Hmm — pick the closest below?' }]);
  }, [busy, freeText, lang, pushUser, pushBot, say, startKnot]);

  // ── 입력 위젯 표시 ──
  const showDatePicker = chat.step === 'date';
  const showTimePicker = chat.step === 'time' && timeTextMode;
  const showRegionPicker = chat.step === 'region';
  // 고민 열기/잇기 단계에서 자유 입력 허용 (선택지 + 직접 타이핑)
  const showConcernInput = chat.step === 'concern' || chat.step === 'link';
  const showPicker = showDatePicker || showTimePicker || showRegionPicker;

  const triRepl: QuickReply[] = [
    { value: 'yes', label: t('네, 맞아요', 'Yes, that fits') },
    { value: 'half', label: t('반반인 것 같아요', 'Sort of') },
    { value: 'no', label: t('음, 잘 모르겠어요', "Hmm, not really") },
  ];

  const quickReplies: QuickReply[] = (() => {
    if (showPicker) return [];
    switch (chat.step) {
      case 'greeting':
        return hasSaved
          ? [
              { value: 'continue', label: t('저장된 사주로 이어서 볼게요', 'Continue with the saved one') },
              { value: 'new', label: t('새로 입력할게요', "I'll start fresh") },
            ]
          : [];
      case 'time':
        return [
          { value: 'unknown', label: t('태어난 시간은 잘 몰라요', "I don't know my birth time") },
          { value: 'input', label: t('시간을 직접 고를게요', "I'll pick the time") },
        ];
      case 'gender':
        return [
          { value: '남', label: t('남성이에요', "I'm male") },
          { value: '여', label: t('여성이에요', "I'm female") },
        ];
      case 'predict':
      case 'hit':
        return triRepl;
      case 'concern':
        return CONCERNS.map(c => ({ value: c.id, label: `${c.emoji} ${t(c.label.ko, c.label.en)}` }));
      case 'narrow': {
        const k = chat.knot;
        if (!k) return [];
        const q = CONCERN_MAP[k.concern].narrow[k.narrowStep];
        return q ? q.options.map(o => ({ value: o.value, label: t(o.label.ko, o.label.en) })) : [];
      }
      case 'link': {
        const rem = remainingConcerns(chat.raisedConcerns);
        return [
          ...rem.map(id => ({ value: id, label: `${CONCERN_MAP[id].emoji} ${t(CONCERN_MAP[id].label.ko, CONCERN_MAP[id].label.en)}` })),
          { value: 'done', label: t('아니, 이거면 됐어요', "No, that's enough") },
        ];
      }
      default:
        return [];
    }
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {messages.map(m => (
          m.era
            ? <EraFactCard key={m.id} facts={eraFactsFor(m.era)} />
            : <ChatBubble key={m.id} message={m} onTyped={m.role === 'bot' ? handleBubbleTyped : undefined} />
        ))}
        {busy && !isTyping && (
          <div className="flex justify-start mb-2">
            <div className="chat-bubble-in rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.96)', border: `1px solid ${SAJU.line}` }}>
              <span className="inline-flex items-center gap-1.5">
                <span className="chat-dot w-1.5 h-1.5 rounded-full" style={{ background: SAJU.inkSub }} />
                <span className="chat-dot w-1.5 h-1.5 rounded-full" style={{ background: SAJU.inkSub, animationDelay: '0.18s' }} />
                <span className="chat-dot w-1.5 h-1.5 rounded-full" style={{ background: SAJU.inkSub, animationDelay: '0.36s' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 입력/선택 영역 */}
      <div className="shrink-0 border-t bg-white/70 backdrop-blur px-3 pt-3 pb-3" style={{ borderColor: SAJU.line }}>
        <QuickReplies replies={quickReplies} onPick={handlePick} disabled={busy} />
        {showDatePicker && <div className="px-0.5 pb-1"><DateSelect onConfirm={acceptDate} t={t} /></div>}
        {showTimePicker && <div className="px-0.5 pb-1"><TimeSelect onConfirm={acceptTime} t={t} /></div>}
        {showRegionPicker && <div className="px-0.5 pb-1"><RegionSelect onConfirm={acceptRegion} t={t} lang={lang} /></div>}
        {showConcernInput && (
          <div className="flex gap-2.5 px-0.5 pb-1">
            <input
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitFreeConcern(); }}
              placeholder={t('편하게 적어주셔도 돼요…', 'Feel free to type…')}
              className="flex-1 rounded-2xl px-4 py-3 text-[15px] outline-none"
              style={{ background: '#fff', border: `1px solid ${SAJU.line}`, color: SAJU.ink }}
            />
            <button
              type="button"
              onClick={submitFreeConcern}
              disabled={busy || !freeText.trim()}
              className="rounded-2xl px-5 py-3 text-[15px] font-semibold text-white disabled:opacity-40"
              style={{ background: SAJU.warmDeep }}
            >
              {t('전송', 'Send')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
