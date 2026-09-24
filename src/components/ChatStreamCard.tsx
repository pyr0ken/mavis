import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Prism from 'prismjs';

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

import { ChatMessage, ToolExecutionState, ToolApprovalRequest } from '../types/island';
import { LiveToolPill } from './LiveToolPill';
import { ToolApprovalBanner } from './ToolApprovalBanner';

export type { ChatMessage };

interface ChatStreamCardProps {
  active: boolean;
  messages: ChatMessage[];
  isStreaming?: boolean;
  isThinking?: boolean;
  activeTool?: ToolExecutionState | null;
  approvalRequest?: ToolApprovalRequest | null;
  onApproveTool?: (id: string) => void;
  onDenyTool?: (id: string) => void;
  onFocusInput?: () => void;
  onClearSession?: () => void;
  onClose?: () => void;
}

const isRTLText = (text: string) => {
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlRegex.test(text);
};

const preprocessLaTeX = (content: string) => {
  if (!content) return '';
  let text = content;

  if (text.includes('\\documentclass') && !text.includes('```')) {
    text = text.replace(/(\\documentclass[\s\S]*?\\end\{document\})/g, '```latex\n$1\n```');
  }

  text = text.replace(/\\\\\[([\s\S]*?)\\\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  text = text.replace(/\\\\\(([\s\S]*?)\\\\\)/g, (_, math) => `$${math.trim()}$`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  text = text.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  text = text.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, math) => `\n$$\n\\begin{aligned}${math}\\end{aligned}\n$$\n`);
  text = text.replace(/\\begin\{gather\*?\}([\s\S]*?)\\end\{gather\*?\}/g, (_, math) => `\n$$\n\\begin{gathered}${math}\\end{gathered}\n$$\n`);
  text = text.replace(/\\begin\{split\*?\}([\s\S]*?)\\end\{split\*?\}/g, (_, math) => `\n$$\n\\begin{aligned}${math}\\end{aligned}\n$$\n`);

  return text;
};

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

      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-gray-200 leading-relaxed custom-scroll">
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </pre>
    </div>
  );
};

export const ChatStreamCard: React.FC<ChatStreamCardProps> = ({
  messages,
  isStreaming = false,
  isThinking = false,
  activeTool = null,
  approvalRequest = null,
  onApproveTool,
  onDenyTool,
  onFocusInput,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
  const middleDragStartY = useRef(0);
  const middleDragStartScrollTop = useRef(0);

  useEffect(() => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, isThinking, activeTool]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
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
      onClick={() => {
        onFocusInput?.();
      }}
      className="w-full h-full flex flex-col justify-between text-left select-text bg-transparent cursor-text"
    >
      {/* Main Conversation Canvas on Unified Obsidian Black */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        className={`flex-1 px-6 py-3 pb-4 flex flex-col gap-3.5 overflow-y-auto custom-scroll ${
          isMiddleMouseDown ? 'cursor-grab select-none' : ''
        }`}
      >
        {/* Inline Security Approval Banner for Mutating Commands */}
        {approvalRequest && onApproveTool && onDenyTool && (
          <ToolApprovalBanner
            request={approvalRequest}
            onApprove={onApproveTool}
            onDeny={onDenyTool}
          />
        )}

        {messages.map((msg, idx) => {
          if (msg.role === 'system' || msg.role === 'tool') return null;
          const isUser = msg.role === 'user';
          const isRtl = isRTLText(msg.content);
          const normalizedContent = preprocessLaTeX(msg.content);
          const isLatestAssistantMessage =
            !isUser &&
            (idx === messages.length - 1 ||
              (idx === messages.length - 2 && messages[messages.length - 1].role === 'tool'));

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

          // Assistant Response Card on Deep Black Surface
          return (
            <div
              key={msg.id}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 text-xs sm:text-sm text-gray-200 shadow-inner"
            >
              {/* Chronologically placed Live Reasoning / Tool Execution inside the Assistant Card */}
              {((isLatestAssistantMessage && (isThinking || activeTool)) || msg.thinking || msg.reasoning) && (
                <LiveToolPill
                  thinking={isLatestAssistantMessage && isThinking}
                  activeTool={isLatestAssistantMessage ? activeTool : null}
                  thinkingContent={msg.thinking || msg.reasoning}
                />
              )}

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
                ) : isThinking || activeTool ? null : (
                  <span className="inline-block w-2 h-4 bg-sky-400 animate-pulse align-middle"></span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomAnchorRef} className="h-px w-full pointer-events-none" />
      </div>
    </div>
  );
};
