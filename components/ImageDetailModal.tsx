/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from "react";
import {
  CloseIcon,
  RegenerateIcon,
  CopyIcon,
  DownloadIcon,
  CheckIcon,
} from "./Icons";
import { GeneratedImage } from "../types";

interface ImageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: GeneratedImage | null;
  onRegenerate: (letter: string) => void;
  isRegenerating: boolean;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  isOpen,
  onClose,
  imageData,
  onRegenerate,
  isRegenerating,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Reset copied state when modal is opened with new data or closed
  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
    }
  }, [isOpen, imageData]);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;

      // Focus management
      const modalElement = modalRef.current;
      if (modalElement) {
        // Try to focus the close button initially for safety, or the first interactive element
        const closeBtn = modalElement.querySelector(
          "[data-modal-close]"
        ) as HTMLElement;
        if (closeBtn) {
          closeBtn.focus();
        } else {
            const focusable = modalElement.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if(focusable.length > 0) {
                (focusable[0] as HTMLElement).focus();
            }
        }
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === "Tab" && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;

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

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent scrolling

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = ""; // Restore scrolling
        if (previousFocus.current) {
            previousFocus.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !imageData) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageData.image;
    link.download = `gentype_${imageData.letter}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (isCopied) return;
    try {
      const response = await fetch(imageData.image);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Revert after 2 seconds
    } catch (err) {
      console.error("Failed to copy image: ", err);
      alert(
        "Failed to copy image. Your browser might not support this feature."
      );
    }
  };

  const handleRegenerate = () => {
    if (!isRegenerating) {
      onRegenerate(imageData.letter);
    }
  };

  const handleKeyPress = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[var(--modal-overlay-bg)] backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      ref={modalRef}
    >
      <div
        className="relative w-[95vw] h-[95vh] sm:w-[90vw] sm:h-[90vh] max-w-[95vh] max-h-[95vw] sm:max-w-[90vh] sm:max-h-[90vw] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageData.image}
          alt={`Generated image for letter ${imageData.letter}`}
          className="w-full h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl"
        />
        {/* Letter display (top-left) */}
        <div className="absolute top-3 sm:top-5 left-3 sm:left-5 z-10 bg-black/40 backdrop-blur-sm text-white text-2xl sm:text-3xl font-black w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full pointer-events-none">
          {imageData.letter.toUpperCase()}
        </div>

        {/* Action Buttons (bottom-center) */}
        {!isRegenerating && (
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-row items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={handleRegenerate}
              onKeyDown={handleKeyPress(handleRegenerate)}
              className="flex items-center justify-center gap-1 sm:gap-2 pl-2 pr-2 sm:pl-4 sm:pr-5 py-2 sm:py-2.5 bg-black/50 backdrop-blur-md text-white font-semibold text-sm sm:text-base rounded-full shadow-lg hover:bg-black/70 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              title="Regenerate"
              aria-label="Regenerate this letter image"
            >
              <RegenerateIcon />
              <span className="whitespace-nowrap">Regenerate</span>
            </button>
            <button
              onClick={handleCopy}
              onKeyDown={handleKeyPress(handleCopy)}
              disabled={isCopied}
              className={`flex items-center justify-center gap-1 sm:gap-2 pl-2 pr-2 sm:pl-4 sm:pr-5 py-2 sm:py-2.5 backdrop-blur-md text-white font-semibold text-sm sm:text-base rounded-full shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                isCopied
                  ? "bg-emerald-600/80 cursor-default"
                  : "bg-black/50 hover:bg-black/70"
              }`}
              title="Copy Image"
              aria-label="Copy image to clipboard"
            >
              {isCopied ? <CheckIcon /> : <CopyIcon />}
              <span className="whitespace-nowrap">
                {isCopied ? "Copied!" : "Copy"}
              </span>
            </button>
            <button
              onClick={handleDownload}
              onKeyDown={handleKeyPress(handleDownload)}
              className="flex items-center justify-center gap-1 sm:gap-2 pl-2 pr-2 sm:pl-4 sm:pr-5 py-2 sm:py-2.5 bg-black/50 backdrop-blur-md text-white font-semibold text-sm sm:text-base rounded-full shadow-lg hover:bg-black/70 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              title="Download Image"
              aria-label="Download image file"
            >
              <DownloadIcon />
              <span className="whitespace-nowrap">Download</span>
            </button>
          </div>
        )}

        {isRegenerating && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-white p-4 sm:p-8 text-center z-20">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-t-white border-r-white border-b-white border-l-transparent rounded-full animate-spin mb-4 sm:mb-6"></div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Regenerating...
            </h2>
            <p className="text-stone-300 text-sm sm:text-base">
              The style is being applied to the letter '{imageData.letter}'.
            </p>
          </div>
        )}

        {/* Close button (top-right) */}
        <button
          onClick={onClose}
          onKeyDown={handleKeyPress(onClose)}
          data-modal-close
          className="absolute top-3 sm:top-5 right-3 sm:right-5 z-30 p-2 sm:p-3 rounded-full transition-colors text-white bg-black/40 backdrop-blur-sm hover:bg-black/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          title="Close"
          aria-label="Close image detail view"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default ImageDetailModal;