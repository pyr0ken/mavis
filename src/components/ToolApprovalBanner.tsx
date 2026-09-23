import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import { ToolApprovalRequest } from '../types/island';

interface ToolApprovalBannerProps {
  request: ToolApprovalRequest;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export const ToolApprovalBanner: React.FC<ToolApprovalBannerProps> = ({
  request,
  onApprove,
  onDeny,
}) => {
  return (
    <div className="w-full my-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 shadow-lg flex flex-col gap-2.5 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-amber-300 tracking-wide uppercase">
            System Permission Required
          </span>
        </div>
        <span className="text-[11px] text-amber-400/70 font-mono">
          Mutating Shell Command
        </span>
      </div>

      <div className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-gray-200 overflow-x-auto whitespace-pre-wrap select-text">
        <code>{request.command}</code>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={() => onDeny(request.id)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-medium active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Deny</span>
        </button>

        <button
          onClick={() => onApprove(request.id)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs shadow-[0_2px_12px_rgba(245,158,11,0.35)] active:scale-95 transition-all cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Allow Execution</span>
        </button>
      </div>
    </div>
  );
};
