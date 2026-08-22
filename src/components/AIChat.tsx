'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Send, Bot, User } from 'lucide-react';
import { CATEGORIES } from '@/lib/booking-schema';
import type { OnboardingState } from '@/lib/ai-onboarding';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  onComplete?: (business: { id: string; slug: string; name: string }) => void;
}

export function AIChat({ onComplete }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I can help you create your booking system. Say \"Create my booking system\", \"Bow\", or just tell me your business name to get started." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);

  const sendText = async (userMsg: string) => {
    if (!userMsg.trim() || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId }),
      });
      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.state) setOnboardingState(data.state as OnboardingState);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      if (data.complete && data.business) {
        onComplete?.(data.business);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendText(input.trim());
  };

  const waitingForCategory = Boolean(onboardingState?.businessName) && !onboardingState?.category;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'assistant' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === 'assistant' ? 'bg-gray-100 text-gray-900' : 'bg-indigo-600 text-white'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-500">Thinking...</div>
          </div>
        )}
      </div>
      {waitingForCategory ? (
        <div className="max-h-40 overflow-y-auto border-t px-3 py-2">
          <p className="mb-2 text-xs font-medium text-gray-500">Choose a business type</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={loading}
                onClick={() => sendText(cat.name)}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:border-indigo-400 dark:border-gray-700 dark:bg-[#16181d] dark:text-gray-200"
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="border-t p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder='Business name, or “Create my booking system”'
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} className="flex-shrink-0">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
