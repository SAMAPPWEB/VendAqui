/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from "react";

interface StyleInputStepProps {
  style: string;
  onStyleChange: (style: string) => void;
  isDisabled?: boolean;
}

const placeholders = [
  "school of fish, underwater, watercolor painting, vibrant",
  "a flock of birds, in the sky, comic book style",
  "candy in grass, aerial view, vector illustration",
  "houseboats, tied together in water, 3D isometric rendering",
  "lasagna, on a plate, aerial photo, HD",
  "chocolate cake with berries, 3D rendering, aerial view, HD",
  "toy cars, on a jute rug, aerial photo, HD",
  "cars, stacked on top of each other, in a desert, vaporwave style",
  "tennis balls, on a blue court, aerial photo, HD",
  "an ice sculpture, in front of a red curtain, straight on photo, HD",
  "honeycomb, pink background, product photo, HD",
  "a jack-o'-lantern carving, at night, HD photo",
  "la single-file line of ladybugs, on a leaf, macro aerial photograph",
  "an island in the ocean, pixel art style",
  "rainbow geyser, in gray rock, aerial photo, HD nature style",
  "lawn mower path, green lawn, aerial photo",
  "apples in apple wonderland, falling apple orchard, dreamy painting",
];

const StyleInputStep: React.FC<StyleInputStepProps> = ({
  style,
  onStyleChange,
  isDisabled = false,
}) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        // Only animate when window is active
        setIsFading(true);
        const timer = setTimeout(() => {
          setCurrentPlaceholderIndex(
            (prevIndex) => (prevIndex + 1) % placeholders.length
          );
          setIsFading(false);
        }, 200);
        return () => clearTimeout(timer);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !style) {
      e.preventDefault();
      onStyleChange(placeholders[currentPlaceholderIndex]);
    }
  };

  const handleTabClick = () => {
    onStyleChange(placeholders[currentPlaceholderIndex]);
  };

  return (
    <section className="w-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider uppercase border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-full px-2 py-0.5">
          Step 1
        </span>
        <span>Describe the style</span>
      </h2>

      <div className="w-full">
        <div className="relative border border-[var(--border-primary)] rounded-3xl shadow-sm flex flex-col min-h-[160px] group transition-all">
          <div className="flex flex-grow relative">
            {/* Placeholder Text (behind textarea) */}
            {!style && (
              <label
                htmlFor="style-input"
                className={`absolute inset-0 z-0 p-6 text-2xl text-left leading-relaxed text-[var(--text-tertiary)] pointer-events-none transition-opacity duration-200 ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
              >
                <span>{placeholders[currentPlaceholderIndex]}</span>
              </label>
            )}

            {/* Textarea (middle layer) */}
            <textarea
              id="style-input"
              value={style}
              onChange={(e) => onStyleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              className={`w-full h-auto min-h-[160px] p-6 bg-transparent text-2xl leading-relaxed focus:outline-none resize-none relative z-10 rounded-3xl ${
                isDisabled
                  ? "text-[var(--text-tertiary)] cursor-not-allowed"
                  : "text-[var(--text-primary)]"
              }`}
              autoFocus={!isDisabled}
            />

            {/* Button (top layer, positioned relative to invisible text) */}
            {!style && (
              <div
                className={`absolute inset-0 z-20 p-6 text-2xl text-left leading-relaxed pointer-events-none transition-opacity duration-200 ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
              >
                <span className="invisible">
                  {placeholders[currentPlaceholderIndex]}
                </span>
                <button
                  type="button"
                  onClick={handleTabClick}
                  disabled={isDisabled}
                  aria-label="Fill with placeholder text"
                  className={`ml-4 text-xs text-center font-semibold tracking-wider uppercase border border-[var(--border-primary)] rounded-full px-2 py-0.5 align-middle pointer-events-auto transition-colors duration-200 ${
                    isDisabled
                      ? "text-[var(--text-tertiary)] cursor-not-allowed opacity-50"
                      : "text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--background-tertiary)]"
                  }`}
                >
                  Tab
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StyleInputStep;