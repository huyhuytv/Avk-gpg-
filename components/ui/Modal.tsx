

import React, { useEffect, useRef } from 'react';
import Button from './Button';
import { VIETNAMESE } from '../../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null); // To store the element that opened the modal

  useEffect(() => {
    const focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(modalRef.current.querySelectorAll<HTMLElement>(focusableElementsSelector));
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
      triggerRef.current = document.activeElement as HTMLElement; // Save focus before modal opens
      document.addEventListener('keydown', handleEscKey);
      
      // A short delay allows the modal to fully render and transition before we manage focus
      setTimeout(() => {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(focusableElementsSelector);
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current?.focus();
        }
        // Add tab trapping listener after initial focus is set
        modalRef.current?.addEventListener('keydown', handleKeyDown);
      }, 100);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      modalRef.current?.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current) {
        triggerRef.current.focus(); // Restore focus to the element that opened the modal
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4" // z-index increased
      onClick={onClose} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col relative text-gray-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
        tabIndex={-1} // Make it focusable
      >
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3 flex-shrink-0">
          <h2 id="modal-title" className="text-2xl font-semibold text-indigo-400">{title}</h2>
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="sm" 
            aria-label={VIETNAMESE.closeButton}
            className="text-gray-400 hover:text-white"
            type="button" // Explicitly set type
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="text-gray-200 flex-grow overflow-y-auto custom-scrollbar">
            {children}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end flex-shrink-0">
            <Button onClick={onClose} variant="secondary" type="button">
                {VIETNAMESE.closeButton}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;