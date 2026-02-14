/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from "react";
import { HistoryItem } from "../types";
import { ViewHistoryIcon } from "./Icons";

interface HistoryGalleryProps {
  history: HistoryItem[];
  onHistorySelect: (item: HistoryItem) => void;
  hideHeader?: boolean;
  disabled?: boolean;
}

const HistoryCard: React.FC<{
  item: HistoryItem;
  onSelect: () => void;
  disabled?: boolean;
}> = ({ item, onSelect, disabled = false }) => {
  const previewImages = item.imagesData.slice(0, 4);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      onClick={() => !disabled && onSelect()}
      onKeyDown={handleKeyPress}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Revisit: ${item.textPrompt} in style ${item.stylePrompt}`}
      aria-disabled={disabled}
      className={`group relative flex flex-col justify-between rounded-xl sm:rounded-2xl shadow-md overflow-hidden aspect-square bg-[var(--background-secondary)] border border-[var(--border-secondary)]/80 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)] ${
        disabled
          ? "cursor-not-allowed opacity-60 grayscale"
          : "cursor-pointer hover:border-[var(--border-primary)] transform hover:-translate-y-1 focus-visible:-translate-y-1"
      }`}
      title={`Revisit: '${item.textPrompt}' in style '${item.stylePrompt}'`}
    >
      <div className="grid grid-cols-2 grid-rows-2 gap-1 flex-grow">
        {previewImages.map((imgData) => (
          <img
            key={imgData.letter}
            src={imgData.image}
            alt={imgData.letter}
            className="w-full h-full object-cover"
          />
        ))}
        {Array.from({ length: 4 - previewImages.length }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="bg-[var(--background-tertiary)]"
          ></div>
        ))}
      </div>
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-all ${
          !disabled ? "group-hover:from-black/90" : ""
        }`}
      ></div>
      <div className="absolute bottom-0 left-0 p-2 sm:p-3 w-full">
        <h4 className="text-white text-2xl sm:text-3xl font-bold truncate tracking-wider">
          {item.textPrompt}
        </h4>
        <p className="text-stone-300 text-xs font-medium leading-tight truncate">
          {item.stylePrompt}
        </p>
      </div>
      {!disabled && (
        <div className="absolute top-2 right-2 p-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ViewHistoryIcon />
        </div>
      )}
    </div>
  );
};

const HistoryGallery: React.FC<HistoryGalleryProps> = ({
  history,
  onHistorySelect,
  hideHeader = false,
  disabled = false,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${!hideHeader ? "mt-16 sm:mt-20" : ""}`}>
      {!hideHeader && (
        <div className="text-left mb-6 sm:mb-8 px-2 sm:px-0">
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            History
          </h3>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base">
            Revisit your previous creations
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0">
        {history.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onSelect={() => onHistorySelect(item)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;