
import React from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  itemCount: number;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen, onToggle, itemCount, children }) => (
  <fieldset className="border border-gray-700 p-0 rounded-md">
    <legend
      className="text-lg font-semibold text-gray-300 px-2 py-2 w-full cursor-pointer hover:bg-gray-700/50 rounded-md transition-colors duration-150 flex justify-between items-center"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
      aria-expanded={isOpen}
    >
      <span>{title} {itemCount !== undefined && `(${itemCount})`}</span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </legend>
    {isOpen && (
      <div className="p-4 space-y-2">
        {children}
      </div>
    )}
  </fieldset>
);

export default CollapsibleSection;