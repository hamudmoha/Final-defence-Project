import React from 'react';
import { Loader, Shield } from 'lucide-react';

export const IntelligenceLoader = ({ 
  text = "Initializing System...", 
  fullScreen = true 
}) => {
  return (
    <div className={`flex items-center justify-center bg-slate-50 ${fullScreen ? 'h-screen' : 'h-full min-h-[400px] w-full'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <Loader className="w-12 h-12 animate-spin text-teal-600 absolute" />
          <span className="text-[10px] font-black text-teal-600 tracking-tighter">ECG</span>
        </div>
        <p className="text-slate-500 font-bold tracking-tight animate-pulse mt-4">
          {text}
        </p>
      </div>
    </div>
  );
};
