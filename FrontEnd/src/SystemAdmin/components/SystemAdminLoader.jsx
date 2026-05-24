import React from 'react';
import { Server } from 'lucide-react';

const SystemAdminLoader = ({ text = "System Admin Initialization..." }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full bg-gray-50/50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-24 h-24">
          {/* Smooth spinning outer ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-green-600 border-l-green-600 opacity-80 animate-[spin_1.5s_cubic-bezier(0.5,0.1,0.4,0.9)_infinite]"></div>
          
          {/* Inner pulsating ring */}
          <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-gray-800 border-r-gray-800 opacity-90 animate-[spin_2s_linear_infinite_reverse]"></div>
          
          {/* Center ECG Text */}
          <div className="bg-white shadow-[0_0_20px_rgba(22,163,74,0.3)] rounded-full w-14 h-14 flex items-center justify-center z-10 animate-pulse">
            <span className="font-bold text-gray-900 text-lg tracking-tighter">ECG</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <p className="text-gray-800 font-bold tracking-widest text-sm uppercase animate-pulse">
            {text}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminLoader;
