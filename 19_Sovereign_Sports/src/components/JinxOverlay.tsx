import React from 'react';

interface JinxEvent {
  userA: string;
  userB: string;
  timestamp: string;
}

export const JinxOverlay: React.FC<{ activeJinx: JinxEvent | null; onClear: () => void }> = () => {
  return null;
};
