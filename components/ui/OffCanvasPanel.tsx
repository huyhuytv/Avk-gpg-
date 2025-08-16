

import React, { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { VIETNAMESE } from '../../constants';

interface OffCanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

const OffCanvasPanel: React.FC<OffCanvasPanelProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  position = 'right' 
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null); // To store the element that opened the panel
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  const onTransitionEnd = () => {
    if (!isOpen) {
      setShouldRender(false);
    }
  };

  useEffect(() => {
    const focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && panelRef.current) {
        const focusableElements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableElementsSelector));
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscKey);
      
      setTimeout(() => {
        const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(focusableElementsSelector);
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          panelRef.current?.focus();
        }
        panelRef.current?.addEventListener('keydown', handleKeyDown);
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      panelRef.current?.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose]);


  if (!shouldRender) {
    return null;
  }

  const panelPositionClass = position === 'left' ? 'left-0' : 'right-0';
  
  const basePanelClasses = `fixed top-0 ${panelPositionClass} h-full w-full max-w-md bg-gray-800 shadow-xl z-55 flex flex-col text-gray-100 transition-transform duration-300 ease-in-out`;

  const transformClasses = isOpen 
    ? 'translate-x-0' 
    : (position === 'left' ? '-translate-x-full' : 'translate-x-full');

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-54 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={`${basePanelClasses} ${transformClasses}`}
        onTransitionEnd={onTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offcanvas-title"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
          <h2 id="offcanvas-title" className="text-xl font-semibold text-indigo-400">{title}</h2>
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="sm" 
            aria-label={VIETNAMESE.closeButton}
            className="text-gray-400 hover:text-white"
            type="button"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};

export default OffCanvasPanel;