/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';
import { SparklesIcon } from './Icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onContinue }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element to restore later
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // Focus the first interactive element
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        // Restore focus
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-[var(--modal-overlay-bg)] backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      aria-describedby="api-key-modal-desc"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-[var(--background-secondary)] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[var(--border-secondary)] transform transition-all relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[var(--background-tertiary)] mb-4">
            <SparklesIcon />
          </div>
          <h3 id="api-key-modal-title" className="text-lg font-medium leading-6 text-[var(--text-primary)] mb-2">
            API Key Required
          </h3>
          <p id="api-key-modal-desc" className="text-sm text-[var(--text-secondary)] mb-6">
            To use this premium model, you need to select a paid API key from your Google Cloud project.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="w-full inline-flex justify-center rounded-full border border-transparent shadow-sm px-4 py-2 bg-[var(--interactive-primary-bg)] text-base font-medium text-[var(--interactive-primary-text)] hover:bg-[var(--interactive-primary-hover-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)] focus-visible:ring-[var(--interactive-primary-bg)] sm:text-sm transition-colors"
            >
              Select API Key
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full inline-flex justify-center rounded-full border border-[var(--border-primary)] shadow-sm px-4 py-2 bg-[var(--background-secondary)] text-base font-medium text-[var(--text-primary)] hover:bg-[var(--background-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)] focus-visible:ring-[var(--border-primary)] sm:text-sm transition-colors"
            >
              Cancel
            </button>
            <div className="mt-2">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)] focus-visible:ring-[var(--text-secondary)] rounded-sm"
                >
                    Learn more about billing
                </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;