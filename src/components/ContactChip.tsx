import React from 'react';
import { InteractiveBlobatar } from './InteractiveBlobatar';

interface ContactChipProps {
  email: string;
  name?: string;
  className?: string;
}

export const ContactChip: React.FC<ContactChipProps> = ({
  email,
  name,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#2C2F3A] hover:bg-[#343845] border border-white/10 text-sm text-gray-200 font-medium transition-colors shadow-sm select-none cursor-pointer ${className}`}
    >
      {/* Interactive geometric Blobatar avatar */}
      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black/40">
        <InteractiveBlobatar
          name={email || 'user'}
          size={24}
        />
      </div>
      <span className="truncate max-w-[280px]">{name || email}</span>
    </div>
  );
};
