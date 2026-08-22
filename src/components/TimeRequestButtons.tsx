'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

const TIME_OPTIONS = [5, 10, 15, 20, 30];

interface TimeRequestButtonsProps {
  onSelect: (minutes: number) => void;
  loading?: boolean;
}

export function TimeRequestButtons({ onSelect, loading }: TimeRequestButtonsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Request additional time</p>
      <div className="flex flex-wrap gap-2">
        {TIME_OPTIONS.map((min) => (
          <Button
            key={min}
            variant="outline"
            size="sm"
            onClick={() => onSelect(min)}
            disabled={loading}
          >
            +{min} min
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
        >
          Custom
        </Button>
      </div>
      {showCustom && (
        <div className="flex gap-2">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Minutes"
            className="w-24 rounded-lg border px-3 py-2 text-sm"
          />
          <Button
            size="sm"
            onClick={() => {
              const mins = parseInt(customMinutes);
              if (mins > 0) onSelect(mins);
            }}
            disabled={loading}
          >
            Request
          </Button>
        </div>
      )}
    </div>
  );
}
