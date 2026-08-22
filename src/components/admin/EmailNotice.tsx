'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Notice = { kind: 'success' | 'error'; text: string } | null;

const Ctx = createContext<{
  notice: Notice;
  showEmailResult: (kind: 'success' | 'error', text: string) => void;
} | null>(null);

export function EmailNoticeProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice>(null);

  const showEmailResult = useCallback((kind: 'success' | 'error', text: string) => {
    setNotice({ kind, text });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <Ctx.Provider value={{ notice, showEmailResult }}>
      {children}
      {notice ? (
        <div
          role="status"
          className={`fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:pl-72 ${
            notice.kind === 'success' ? '' : ''
          }`}
        >
          <div
            className={`mx-auto max-w-6xl rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${
              notice.kind === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {notice.text}
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

export function useEmailNotice() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      notice: null,
      showEmailResult: (_kind: 'success' | 'error', _text: string) => {},
    };
  }
  return ctx;
}

export async function reportEmailResponse(
  res: Response,
  data: { error?: string; emailSent?: boolean; sent?: number },
  showEmailResult: (kind: 'success' | 'error', text: string) => void,
  successText = 'Email sent successfully'
) {
  if (!res.ok || data.emailSent === false) {
    showEmailResult('error', data.error || 'Error: Unable to send');
    return false;
  }
  if (typeof data.sent === 'number') {
    if (data.sent < 1) {
      showEmailResult('error', 'Error: Unable to send');
      return false;
    }
    showEmailResult('success', `Email sent successfully (${data.sent})`);
    return true;
  }
  showEmailResult('success', successText);
  return true;
}
