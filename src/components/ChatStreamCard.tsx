import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArrowRight, RotateCcw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Prism from 'prismjs';

// Load popular language syntaxes for Prism
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-latex';

import { ChatMessage } from '../types/island';

export type { ChatMessage };

interface ChatStreamCardProps {
  active: boolean;
  messages: ChatMessage[];
  isStreaming?: boolean;
  onClearSession?: () => void;
  onClose: () => void;
}

const isRTLText = (text: string) => {
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlRegex.test(text);
};

// Comprehensive LaTeX preprocessor for both math formulas and raw LaTeX document structures
const preprocessLaTeX = (content: string) => {
  if (!content) return '';
  let text = content;

  // If the model outputs a raw LaTeX document structure (e.g. \documentclass ... \begin{document} ... \end{document})
  // Wrap it in a ```latex code block so Prism syntax-highlights it cleanly with a copy button
  if (text.includes('\\documentclass') && !text.includes('```')) {
    text = text.replace(/(\\documentclass[\s\S]*?\\end\{document\})/g, '```latex\n$1\n```');
  }

  // Convert double-escaped or standard \[ ... \] to $$...$$
  text = text.replace(/\\\\\[([\s\S]*?)\\\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // Convert double-escaped or standard \( ... \) to $...$
  text = text.replace(/\\\\\(([\s\S]*?)\\\\\)/g, (_, math) => `$${math.trim()}$`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // Convert standalone math environments to $$...$$ blocks
  text = text.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  text = text.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, math) => `\n$$\n\\begin{aligned}${math}\\end{aligned}\n$$\n`);
  text = text.replace(/\\begin\{gather\*?\}([\s\S]*?)\\end\{gather\*?\}/g, (_, math) => `\n$$\n\\begin{gathered}${math}\\end{gathered}\n$$\n`);
  text = text.replace(/\\begin\{split\*?\}([\s\S]*?)\\end\{split\*?\}/g, (_, math) => `\n$$\n\\begin{aligned}${math}\\end{aligned}\n$$\n`);

  return text;
};

// Syntax-Highlighted Code Block Component with Copy Action & Header Badge
const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language = 'text', value }) => {
  const [copied, setCopied] = useState(false);

  const highlightedHtml = useMemo(() => {
    const lang = language.toLowerCase();
    const grammar = Prism.languages[lang] || Prism.languages.latex || Prism.languages.javascript || Prism.languages.text;
    try {
      return Prism.highlight(value, grammar, lang);
    } catch {
      return value;
    }
  }, [language, value]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-white/10 bg-[#080a10] overflow-hidden shadow-lg select-text text-left" dir="ltr">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] border-b border-white/[0.06] select-none">
        <span className="text-[11px] font-mono text-gray-400 font-semibold lowercase">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-gray-200 leading-relaxed custom-scroll">
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
};

export const ChatStreamCard: React.FC<ChatStreamCardProps> = ({
  messages,
  isStreaming = false,
  onClearSession,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  // Middle Click Drag-to-Scroll State
  const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
  const middleDragStartY = useRef(0);
  const middleDragStartScrollTop = useRef(0);

  // Auto-scroll to bottom on incoming stream tokens
  useEffect(() => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Middle Click Mouse Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      // Middle Click (Scroll Wheel Button)
      e.preventDefault();
      setIsMiddleMouseDown(true);
      middleDragStartY.current = e.clientY;
      if (scrollRef.current) {
        middleDragStartScrollTop.current = scrollRef.current.scrollTop;
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMiddleMouseDown || !scrollRef.current) return;
      const deltaY = e.clientY - middleDragStartY.current;
      scrollRef.current.scrollTop = middleDragStartScrollTop.current + deltaY * 1.5;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1 || isMiddleMouseDown) {
        setIsMiddleMouseDown(false);
      }
    };

    if (isMiddleMouseDown) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMiddleMouseDown]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full h-full flex flex-col justify-between text-left select-text bg-[#16181F]/95"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#1F222B] border-b border-white/[0.08] rounded-t-[22px] select-none">
        <div className="flex items-center gap-2.5">
          {/* Frameless Radiant Mavis Intelligence Orb */}
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            {/* Ambient colorful backlight aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-fuchsia-500 blur-[5px] opacity-75 animate-pulse" />
            
            {/* Vector Intelligence Glyph */}
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 relative z-10 drop-shadow-[0_0_8px_rgba(56,189,248,0.85)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="mavis-header-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="45%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#E879F9" />
                </linearGradient>
                <linearGradient id="mavis-header-core" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#BAE6FD" />
                </linearGradient>
              </defs>
              <path
                d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
                fill="url(#mavis-header-grad)"
              />
              <circle cx="12" cy="12" r="2.75" fill="url(#mavis-header-core)" />
            </svg>
          </div>

          <span className="text-sm font-semibold text-white tracking-wide">
            Mavis Intelligence
          </span>
        </div>

        {/* Clear / Reset Session Button */}
        {messages.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearSession?.();
            }}
            title="Clear conversation session"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 active:scale-95 transition-all text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Main Conversation Stream Area with Middle-Click Scroll */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className={`flex-1 px-6 py-4 flex flex-col gap-3.5 overflow-y-auto custom-scroll ${
          isMiddleMouseDown ? 'cursor-grab select-none' : ''
        }`}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isRtl = isRTLText(msg.content);
          const normalizedContent = preprocessLaTeX(msg.content);

          if (isUser) {
            return (
              <div
                key={msg.id}
                className={`flex ${isRtl ? 'justify-start' : 'justify-end'}`}
              >
                <div className="max-w-[85%] bg-[#1E2333]/90 border border-sky-400/20 text-sky-100 text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-sm">
                  <p
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={`whitespace-pre-wrap leading-relaxed font-sans text-white ${
                      isRtl ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          }

          // Assistant Response Card with Full LaTeX Math, Syntax Highlighting & Beautiful Dividers
          return (
            <div
              key={msg.id}
              className="w-full bg-[#1A1D27]/90 border border-white/[0.08] rounded-2xl p-4 text-xs sm:text-sm text-gray-200 shadow-inner"
            >
              <div
                dir={isRTLText(msg.content) ? 'rtl' : 'ltr'}
                className={`leading-relaxed font-sans prose prose-invert max-w-none ${
                  isRTLText(msg.content) ? 'text-right' : 'text-left'
                }`}
              >
                {normalizedContent ? (
                  <ReactMarkdown
                    remarkPlugins={[[remarkMath, { singleDollarTextMath: true }], remarkGfm]}
                    rehypePlugins={[[rehypeKatex, { output: 'htmlAndMathml', throwOnError: false }]]}
                    components={{
                      p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({ children }) => <em className="text-gray-300 italic">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2.5 space-y-1 text-gray-300">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2.5 space-y-1 text-gray-300">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      // Premium Divider Line (Gleaming Subtle Gradient with Glass Dot)
                      hr: () => (
                        <div className="relative my-4 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                          <div className="absolute w-1.5 h-1.5 rounded-full bg-sky-400/80 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                        </div>
                      ),
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const isInline = !match && typeof children === 'string' && !children.includes('\n');

                        if (isInline) {
                          return (
                            <code className="px-1.5 py-0.5 rounded bg-white/10 text-sky-300 font-mono text-[11px] border border-white/10" {...props}>
                              {children}
                            </code>
                          );
                        }

                        return (
                          <CodeBlock
                            language={match ? match[1] : 'text'}
                            value={codeString}
                          />
                        );
                      },
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2.5 rounded-xl border border-white/10 bg-black/40">
                          <table className="min-w-full text-xs overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-white/[0.06] border-b border-white/10">{children}</thead>,
                      th: ({ children }) => <th className="px-3.5 py-2 text-left font-semibold text-white">{children}</th>,
                      td: ({ children }) => <td className="px-3.5 py-2 border-t border-white/5 text-gray-300">{children}</td>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-sky-400/80 bg-sky-500/5 px-3.5 py-2 my-2.5 rounded-r-xl italic text-gray-300">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {normalizedContent}
                  </ReactMarkdown>
                ) : (
                  <span className="inline-block w-2 h-4 bg-sky-400 animate-pulse align-middle"></span>
                )}
              </div>
            </div>
          );
        })}
        {/* Invisible anchor to ensure smooth auto-scrolling to bottom */}
        <div ref={bottomAnchorRef} className="h-px w-full pointer-events-none" />
      </div>

      {/* Bottom Footer / Actions */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#1A1C24] border-t border-white/[0.08] rounded-b-[22px] select-none">
        <span className="text-[11px] text-gray-500 font-mono">
          Press Space or Esc to dismiss
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-[#2B7FFF] to-[#1E6FE8] hover:from-[#388BFF] hover:to-[#2B7FFF] active:scale-95 text-white font-semibold text-xs shadow-[0_4px_16px_rgba(43,127,255,0.4)] transition-all cursor-pointer"
        >
          <span>Done</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
