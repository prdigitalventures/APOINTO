'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Search, Volume2 } from 'lucide-react';
import { Button } from './ui/Button';

interface Proposal {
  businessId: string;
  businessName: string;
  slug: string;
  serviceId: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  date: string;
  startTime: string;
  spokenTime: string;
}

interface AssistantResponse {
  reply: string;
  speak?: boolean;
  needsConsent?: boolean;
  proposal?: Proposal;
  alternatives?: string[];
  businesses?: Array<{ id: string; name: string; slug: string; category: string; location: string | null }>;
  booked?: { id: string };
}

interface LocationState {
  city: string;
  latitude?: number;
  longitude?: number;
  label: string;
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export function CustomerAssistantBar({
  location,
  onNavigateBooking,
}: {
  location: LocationState;
  onNavigateBooking?: (id: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantResponse | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  const send = async (text: string, confirmBooking = false) => {
    const message = text.trim();
    if (!message && !confirmBooking) return;
    setLoading(true);
    try {
      const res = await fetch('/api/assistant/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message || 'yes',
          city: location.city,
          latitude: location.latitude,
          longitude: location.longitude,
          proposal,
          confirmBooking,
        }),
      });
      const data: AssistantResponse = await res.json();
      setResult(data);
      if (data.proposal) setProposal(data.proposal);
      if (data.booked) setProposal(null);
      if (data.speak !== false && data.reply) speak(data.reply);
      if (data.booked?.id) onNavigateBooking?.(data.booked.id);
    } catch {
      const fail = 'Sorry, I could not process that. Please try again.';
      setResult({ reply: fail });
      speak(fail);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const Ctor = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!Ctor) {
      speak('Voice is not supported in this browser. Please type your request.');
      setResult({ reply: 'Voice is not supported in this browser. Please type your request.' });
      return;
    }
    const recognition = new Ctor() as {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      send(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(query);
        }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          className="w-full bg-gray-100 rounded-2xl pl-11 pr-14 py-3.5 text-sm"
          placeholder='Book a haircut at Green Trends at 4 PM today'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          aria-label={listening ? 'Stop listening' : 'Voice assistant'}
          onClick={listening ? stopVoice : startVoice}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center ${
            listening ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'
          }`}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Finding the best slot…</p>}

      {result && (
        <div className="bg-white rounded-2xl border p-4 space-y-3">
          <div className="flex gap-2 items-start">
            <Volume2 size={16} className="text-indigo-600 mt-0.5" />
            <p className="text-sm text-gray-800">{result.reply}</p>
          </div>
          {result.needsConsent && proposal && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => send('yes', true)} disabled={loading}>
                Yes, book {proposal.spokenTime}
              </Button>
              <Button size="sm" variant="outline" onClick={() => send('no')} disabled={loading}>
                No
              </Button>
            </div>
          )}
          {result.businesses && result.businesses.length > 0 && (
            <div className="space-y-2">
              {result.businesses.map((b) => (
                <button
                  key={b.id}
                  className="w-full text-left text-sm bg-gray-50 rounded-xl p-3"
                  onClick={() => router.push(`/${b.slug}`)}
                >
                  <span className="font-medium">{b.name}</span>
                  {b.location && <span className="text-gray-500"> · {b.location}</span>}
                </button>
              ))}
            </div>
          )}
          {result.booked && (
            <Button size="sm" onClick={() => router.push(`/customer/bookings/${result.booked!.id}`)}>
              View booking
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

