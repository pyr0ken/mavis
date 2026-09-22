import React, { useEffect, useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { AudioWaveformBars } from './AudioWaveformBars';

interface ListeningViewProps {
  active: boolean;
}

const PHRASES = [
  "Find the latest research notes on my screen...",
  "Send an email to David regarding sprint goals...",
  "Schedule a meeting for tomorrow at 10 AM...",
  "Summarize the open document in one paragraph...",
  "Search for last year's tax return document...",
];

export const ListeningView: React.FC<ListeningViewProps> = ({ active }) => {
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (!active) {
      setTypedText('');
      return;
    }

    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < phrase.length) {
        setTypedText(phrase.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="w-full h-full flex flex-col justify-between p-4">
      {/* Top row: Mic icon, title, waveform */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>VoiceOS</span>
            </div>
            <div className="text-[11px] text-gray-300 font-medium">Listening to your command...</div>
          </div>
        </div>

        <AudioWaveformBars active={active} />
      </div>

      {/* Live transcript text box */}
      <div className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 flex items-center gap-2 mt-2 shadow-inner">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="text-xs text-gray-100 font-medium truncate">
          {typedText || "Listening..."}
        </span>
      </div>
    </div>
  );
};
