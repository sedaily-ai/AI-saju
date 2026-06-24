'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/shared/lib/LangContext';
import { SAJU } from '@/shared/ui/sajuTokens';
import { ChatBubble } from './ChatBubble';
import { QuickReplies } from './QuickReplies';
import { DateSelect, TimeSelect, RegionSelect } from './BirthPicker';
import {
  computeSaju,
  loadSavedDraft,
  ilganLabel,
} from '../lib/chatFlow';
import { buildAnswer, followUp, TOPICS, type ChongunCache } from '../lib/chatAnswers';
import type { ChatMessage, ChatState, DraftInput, QuickReply, TopicId } from '../lib/types';

const INITIAL: ChatState = { step: 'greeting', draft: {}, pillars: null, ilgan: '', daeuns: [] };

export function ChatTab() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState<ChatState>(INITIAL);
  const [busy, setBusy] = useState(false);
  /** 시간 직접 입력 모드 (step==='time' 일 때만 의미) */
  const [timeTextMode, setTimeTextMode] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** StrictMode 등으로 마운트 effect 가 두 번 돌아 인사가 중복되는 것 방지 */
  const greetedRef = useRef(false);
  /** chongun 해석 캐시는 용량이 커서(수 MB) 필요할 때만 lazy 로드 */
  const chongunCacheRef = useRef<{ lang: string; data: ChongunCache | null } | null>(null);
  const chongunPromiseRef = useRef<Promise<ChongunCache | null> | null>(null);
  const nextId = () => `m${idRef.current++}`;

  const ensureChongunCache = useCallback((): Promise<ChongunCache | null> => {
    const cur = chongunCacheRef.current;
    if (cur && cur.lang === lang) return Promise.resolve(cur.data);
    if (chongunPromiseRef.current) return chongunPromiseRef.current;
    const url = `/saju-cache/chongun${lang === 'en' ? '-en' : ''}.json`;
    const p = fetch(url)
      .then(r => (r.ok ? r.json() : null))
      .then((json: ChongunCache | null) => {
        chongunCacheRef.current = { lang, data: json };
        chongunPromiseRef.current = null;
        return json;
      })
      .catch(() => { chongunPromiseRef.current = null; return null; });
    chongunPromiseRef.current = p;
    return p;
  }, [lang]);

  // ── 말풍선 헬퍼 ──
  const pushUser = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: nextId(), role: 'user', text }]);
  }, []);

  /** 봇 말풍선을 시간차로 추가. 다음 말풍선은 "타이핑 시간 + 여유" 만큼 기다림. */
  const pushBot = useCallback((texts: string[], markdown: boolean, onDone?: () => void) => {
    if (!texts.length) { onDone?.(); return; }
    setBusy(true);
    let i = 0;
    const step = () => {
      const text = texts[i];
      setMessages(prev => [...prev, { id: nextId(), role: 'bot', text, markdown }]);
      i += 1;
      if (i < texts.length) {
        // 일반 텍스트는 글자수만큼 찍히는 시간 + 여유, 마크다운은 고정 + 여유 (느리게)
        const typeMs = markdown ? 650 : Math.min(text.length * 24, 2600);
        window.setTimeout(step, typeMs + 1000);
      } else {
        setBusy(false);
        onDone?.();
      }
    };
    window.setTimeout(step, 700);
  }, []);

  // 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  // 타이핑/대화가 진행되는 동안 스크롤을 바닥에 고정 (글자가 늘어나도 따라감)
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, 140);
    return () => window.clearInterval(id);
  }, [busy]);

  // ── 초기 인사 (1회만) ──
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const saved = loadSavedDraft();
    setHasSaved(!!saved);
    if (saved) {
      const d = saved.draft;
      const dateLabel = d.y != null
        ? `${d.y}/${String(d.m).padStart(2, '0')}/${String(d.d).padStart(2, '0')}`
        : '';
      const genderLabel = d.gender === '남' ? t('남성', 'male') : d.gender === '여' ? t('여성', 'female') : '';
      const info = [dateLabel, genderLabel].filter(Boolean).join(' · ');
      pushBot(
        [
          t('안녕하세요! 사주 챗봇이에요. 🔮', "Hi! I'm the Saju chatbot. 🔮"),
          t(
            `이전에 이 사이트에서 본 사주(${info})가 저장돼 있어요. 이어서 볼까요, 아니면 새로 입력할까요?`,
            `A saju you viewed on this site earlier (${info}) is saved. Continue with it, or start fresh?`,
          ),
        ],
        false,
      );
    } else {
      pushBot(
        [
          t('안녕하세요! 사주 챗봇이에요. 🔮', "Hi! I'm the Saju chatbot. 🔮"),
          t('그럼 시작해볼게요! 먼저 태어난 날(양력)을 아래에서 골라주세요.', "Let's begin! First, pick your birth date (solar calendar) below."),
        ],
        false,
        () => setChat(c => ({ ...c, step: 'date' })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 원국 계산 + 요약 + 메뉴 진입 ──
  const goToMenu = useCallback((draft: DraftInput, state?: Partial<ChatState>) => {
    let pillars = state?.pillars ?? null;
    let ilgan = state?.ilgan ?? '';
    let daeuns = state?.daeuns ?? [];
    if (!pillars) {
      const res = computeSaju(draft);
      if (!res) {
        pushBot(
          [t('사주를 계산하지 못했어요. 처음부터 다시 해볼까요?', 'Could not compute. Want to restart?')],
          false,
          () => setChat({ ...INITIAL, step: 'date' }),
        );
        return;
      }
      pillars = res.pillars; ilgan = res.ilgan; daeuns = res.daeuns;
    }
    setChat({ step: 'menu', draft, pillars, ilgan, daeuns });
    pushBot(
      [
        t(`사주를 펼쳐봤어요! 당신은 **${ilganLabel(pillars!)}** 일간이네요. ✨`,
          `Your chart is ready! Your Day Master is **${ilganLabel(pillars!)}**. ✨`),
        t('궁금한 걸 골라주시면 하나씩 풀어드릴게요. 아래에서 눌러보세요. 👇', "Pick what you're curious about and I'll walk you through it. 👇"),
      ],
      true,
    );
  }, [pushBot, t]);

  // ── 주제 답변 ──
  const answerTopic = useCallback(async (topic: TopicId) => {
    if (topic === 'restart') {
      setChat({ ...INITIAL, step: 'date' });
      setTimeTextMode(false);
      pushBot([t('좋아요, 처음부터 새로 볼게요! 태어난 날을 아래에서 골라주세요.', "Sure, let's start fresh! Pick your birth date below.")], false);
      return;
    }
    if (!chat.pillars || chat.draft.y == null) return;

    // '내 성향' 은 깊이 있는 해석 캐시를 쓰므로 필요 시 lazy 로드
    let cache = chongunCacheRef.current?.lang === lang ? chongunCacheRef.current.data : null;
    if (topic === 'chongun' && !cache) {
      setBusy(true);
      cache = await ensureChongunCache();
    }

    const bubbles = buildAnswer(
      topic,
      { pillars: chat.pillars, daeuns: chat.daeuns, birthYear: chat.draft.y, chongunCache: cache },
      t,
    );
    pushBot(bubbles, true, () =>
      pushBot([followUp(topic, t)], false),
    );
  }, [chat, lang, ensureChongunCache, pushBot, t]);

  // ── quick-reply 처리 ──
  const handlePick = useCallback((reply: QuickReply) => {
    if (busy) return;
    const { step } = chat;

    if (step === 'greeting') {
      pushUser(reply.label);
      if (reply.value === 'continue') {
        const saved = loadSavedDraft();
        if (saved) {
          goToMenu(saved.draft, { pillars: saved.pillars, ilgan: saved.ilgan, daeuns: saved.daeuns });
          return;
        }
      }
      // 'new'
      setChat({ ...INITIAL, step: 'date' });
      pushBot([t('생년월일을 알려주세요. (예: 1995/03/15)', 'Tell me your birth date. (e.g. 1995/03/15)')], false);
      return;
    }

    if (step === 'time') {
      if (reply.value === 'input') {
        pushUser(reply.label);
        setTimeTextMode(true);
        pushBot([t('아래에서 태어난 시각을 골라주세요.', 'Pick your birth time below.')], false);
        return;
      }
      // 모름
      pushUser(reply.label);
      const draft = { ...chat.draft, noTime: true, hour: undefined, min: undefined };
      setChat(c => ({ ...c, draft, step: 'gender' }));
      pushBot([t('성별도 알려주실래요? 대운 방향을 정하는 데 필요해요.', 'Your gender? It sets the direction of your luck cycles.')], false);
      return;
    }

    if (step === 'gender') {
      pushUser(reply.label);
      const draft = { ...chat.draft, gender: reply.value as '남' | '여' };
      setChat(c => ({ ...c, draft, step: 'region' }));
      pushBot([t('마지막이에요! 태어난 지역은 어디인가요? 진태양시 보정에 쓰여요.', 'Last one! Where were you born? Used for true-solar-time correction.')], false);
      return;
    }

    if (step === 'menu') {
      pushUser(reply.label);
      void answerTopic(reply.value as TopicId);
      return;
    }
  }, [busy, chat, goToMenu, answerTopic, pushUser, pushBot, t]);

  // ── 드롭다운 선택 처리 (날짜 / 시각) ──
  const acceptDate = useCallback((y: number, m: number, d: number) => {
    if (busy) return;
    pushUser(`${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`);
    const draft = { ...chat.draft, y, m, d };
    setChat(c => ({ ...c, draft, step: 'time' }));
    pushBot([t('좋아요! 혹시 태어난 시간도 아시나요? 시간을 알면 더 정확해져요.', 'Great! Do you happen to know your birth time? It makes the reading more precise.')], false);
  }, [busy, chat, pushUser, pushBot, t]);

  const acceptTime = useCallback((hour: number, min: number) => {
    if (busy) return;
    pushUser(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    const draft = { ...chat.draft, hour, min, noTime: false };
    setTimeTextMode(false);
    setChat(c => ({ ...c, draft, step: 'gender' }));
    pushBot([t('성별도 알려주실래요? 대운 방향을 정하는 데 필요해요.', 'Your gender? It sets the direction of your luck cycles.')], false);
  }, [busy, chat, pushUser, pushBot, t]);

  const acceptRegion = useCallback((value: string, label: string) => {
    if (busy) return;
    pushUser(label);
    goToMenu({ ...chat.draft, region: value });
  }, [busy, chat, goToMenu, pushUser]);

  // ── 현재 단계의 입력 위젯 ──
  const showDatePicker = chat.step === 'date';
  const showTimePicker = chat.step === 'time' && timeTextMode;
  const showRegionPicker = chat.step === 'region';
  const showPicker = showDatePicker || showTimePicker || showRegionPicker;

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
      case 'menu':
        return TOPICS.map(tp => ({ value: tp.id, label: t(tp.ko, tp.en) }));
      default:
        return [];
    }
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 메시지 영역 — 이 영역만 스크롤 */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {messages.map(m => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {busy && (
          <div className="flex justify-start mb-2">
            <div
              className="chat-bubble-in rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.96)', border: `1px solid ${SAJU.line}` }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="chat-dot w-1.5 h-1.5 rounded-full" style={{ background: SAJU.inkSub }} />
                <span className="chat-dot w-1.5 h-1.5 rounded-full" style={{ background: SAJU.inkSub, animationDelay: '0.18s' }} />
                <span className="chat-dot w-1.5 h-1.5 rounded-full" style={{ background: SAJU.inkSub, animationDelay: '0.36s' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 입력/선택 영역 — 항상 하단 고정 (shrink-0) */}
      <div className="shrink-0 border-t bg-white/70 backdrop-blur px-3 pt-3 pb-3" style={{ borderColor: SAJU.line }}>
        <QuickReplies replies={quickReplies} onPick={handlePick} disabled={busy} />
        {showDatePicker && (
          <div className="px-0.5 pb-1">
            <DateSelect onConfirm={acceptDate} t={t} />
          </div>
        )}
        {showTimePicker && (
          <div className="px-0.5 pb-1">
            <TimeSelect onConfirm={acceptTime} t={t} />
          </div>
        )}
        {showRegionPicker && (
          <div className="px-0.5 pb-1">
            <RegionSelect onConfirm={acceptRegion} t={t} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}
