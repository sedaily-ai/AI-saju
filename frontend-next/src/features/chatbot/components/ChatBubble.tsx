'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SAJU } from '@/shared/ui/sajuTokens';
import type { ChatMessage } from '../lib/types';

/** 글자당 타이핑 속도(ms) — ChatTab 의 답변 간격 계산과 맞춰져 있음 */
export const TYPE_SPEED = 24;

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isBot = message.role === 'bot';
  // 봇의 일반 텍스트만 타자기 효과. 마크다운 답변·내 말풍선은 즉시 표시.
  const typewriter = isBot && !message.markdown;
  const shown = useTypewriter(message.text, typewriter);
  const typing = typewriter && shown.length < message.text.length;

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`${isBot ? 'chat-in-bot' : 'chat-in-user'} max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed break-words`}
        style={
          isBot
            ? { background: 'rgba(255,255,255,0.96)', border: `1px solid ${SAJU.line}`, color: SAJU.ink }
            : { background: SAJU.warmDeep, color: '#fff' }
        }
      >
        {message.markdown ? (
          <div className="chat-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
          </div>
        ) : (
          <>
            {shown}
            {typing && <span className="chat-caret" style={{ background: isBot ? SAJU.inkSub : '#fff' }} />}
          </>
        )}
      </div>
    </div>
  );
}

/** full 문자열을 한 글자씩 드러냄. 메시지는 id 로 keying 되어 인스턴스마다 full 이 고정. */
function useTypewriter(full: string, enabled: boolean): string {
  const [shown, setShown] = useState(() => (enabled ? '' : full));
  useEffect(() => {
    if (!enabled) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, TYPE_SPEED);
    return () => window.clearInterval(id);
  }, [full, enabled]);
  return shown;
}
