
import React, { useState } from 'react';
import { GameMessage } from '../../../types';

interface SystemMessageGroupProps {
  messages: GameMessage[];
}

const SystemMessageGroup: React.FC<SystemMessageGroupProps> = ({ messages }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (messages.length === 0) {
    return null;
  }
  
  // If there's only one system message, render it directly without the collapsible UI.
  if (messages.length === 1) {
    return (
        <div className="bg-yellow-600 bg-opacity-30 text-yellow-200 border border-yellow-500 italic text-xs sm:text-sm p-2 sm:p-3 rounded-xl shadow">
            {messages[0].content}
        </div>
    );
  }

  return (
    <div className="bg-gray-700/50 border border-gray-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-2 flex justify-between items-center hover:bg-gray-700/80 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-gray-300">
          Có {messages.length} thông báo hệ thống... (Nhấn để xem)
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-2 sm:p-3 border-t border-gray-600/50 space-y-1">
          {messages.map(msg => (
            <p key={msg.id} className="text-xs text-yellow-200/90 italic">
              - {msg.content}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemMessageGroup;
