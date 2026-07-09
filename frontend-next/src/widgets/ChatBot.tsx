'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useLang } from '@/shared/lib/LangContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLang();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // TODO: 실제 API 연결 — 현재는 간단한 에코 응답
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t(
          '안녕하세요! 사주매칭 챗봇입니다. 현재 준비 중이에요 🙏',
          'Hello! I\'m the Saju Matching chatbot. Coming soon 🙏',
        ),
      };
      setMessages((prev) => [...prev, reply]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl border border-gray-200 bg-white flex flex-col overflow-hidden"
          style={{ height: '420px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-800">
              {t('사주매칭 챗봇', 'Saju Chatbot')}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t('채팅 닫기', 'Close chat')}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-8">
                {t('무엇이든 물어보세요 ✨', 'Ask me anything ✨')}
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-800',
                  ].join(' ')}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-400">
                  ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-white"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('메시지를 입력하세요...', 'Type a message...')}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 outline-none focus:border-emerald-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label={t('보내기', 'Send')}
              className="p-2 rounded-full bg-emerald-500 text-white disabled:opacity-40 hover:bg-emerald-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t('챗봇 열기', 'Open chatbot')}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-colors"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
