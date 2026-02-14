/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from "react";

interface GalleryItem {
  prompt: string;
  image: string;
}

interface SampleGalleryProps {
  onPromptSelect: (prompt: string) => void;
  hideHeader?: boolean;
  disabled?: boolean;
}

const SampleGallery: React.FC<SampleGalleryProps> = ({
  onPromptSelect,
  hideHeader = false,
  disabled = false,
}) => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        const response = await fetch("/assets/gallery.json");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: GalleryItem[] = await response.json();
        setGalleryItems(data);
      } catch (e) {
        setError("Failed to load gallery samples.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full text-center flex flex-col items-center gap-3 sm:gap-4">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[var(--text-primary)]"></div>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base">
          Loading Gallery...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center text-[var(--text-error)] text-sm sm:text-base">
        {error}
      </div>
    );
  }

  if (galleryItems.length === 0) {
    return null; // Don't render anything if there are no items
  }

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8">
      {!hideHeader && (
        <div className="text-left">
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Gallery
          </h3>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base">
            Click an example to try it out
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {galleryItems.map((item, index) => {
          const handleKeyPress = (e: React.KeyboardEvent) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPromptSelect(item.prompt);
            }
          };

          return (
            <div
              key={index}
              className={`group relative rounded-xl sm:rounded-2xl shadow-md overflow-hidden aspect-square z-0 hover:z-20 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)] transition-all duration-200 ${
                disabled
                  ? "cursor-not-allowed opacity-60 grayscale"
                  : "cursor-pointer hover:scale-105"
              }`}
              onClick={() => !disabled && onPromptSelect(item.prompt)}
              onKeyDown={handleKeyPress}
              tabIndex={disabled ? -1 : 0}
              role="button"
              aria-label={`Use prompt: ${item.prompt}`}
              aria-disabled={disabled}
              title={`Use prompt: "${item.prompt}"`}
            >
              <img
                src={item.image}
                alt={item.prompt}
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  !disabled ? "group-hover:scale-105" : ""
                }`}
              />
              {!disabled && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all group-hover:from-black/80"></div>
              )}
              {disabled && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all"></div>
              )}
              <p className="absolute bottom-0 left-0 p-2 sm:p-3 text-white text-xs sm:text-sm font-medium leading-tight">
                {item.prompt}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SampleGallery;