
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface ContextHelpProps {
  text: string;
}

export const ContextHelp: React.FC<ContextHelpProps> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1">
      <button 
        type="button"
        className="text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <HelpCircle size={14} />
      </button>
      
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};
