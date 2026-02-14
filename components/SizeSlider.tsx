/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from "react";

interface SizeSliderProps {
  size: number;
  onSizeChange: (newSize: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const SizeSlider: React.FC<SizeSliderProps> = ({
  size,
  onSizeChange,
  min = 64,
  max = 256,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onSizeChange(Number(event.target.value));
  };

  return (
    <div
      className={`w-full max-w-full lg:max-w-xs xl:max-w-sm p-2 sm:p-3 bg-[var(--background-tertiary)] border border-[var(--border-secondary)]/90 rounded-full flex items-center gap-2 sm:gap-4 shadow-sm transition-opacity duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <span className="text-lg sm:text-xl font-semibold text-[var(--text-secondary)] select-none pl-1 sm:pl-2 flex-shrink-0">
        A
      </span>
      <div className="w-full h-6 flex items-center min-w-0">
        <input
          type="range"
          min={min}
          max={max}
          value={size}
          onChange={handleChange}
          disabled={disabled}
          className="w-full appearance-none cursor-pointer slider-thumb bg-transparent disabled:cursor-not-allowed"
          aria-label="Adjust image size"
        />
      </div>
      <span className="text-2xl sm:text-3xl font-semibold text-[var(--text-secondary)] select-none pr-1 sm:pr-2 flex-shrink-0">
        A
      </span>
      <style>{`
        .slider-thumb {
            --thumb-size: 18px;
            --track-height: 4px;
            --thumb-color: var(--text-secondary);
            --track-color: var(--text-tertiary);
        }
        @media (min-width: 640px) {
          .slider-thumb {
            --thumb-size: 20px;
          }
        }
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: var(--thumb-size);
          height: var(--thumb-size);
          background: var(--thumb-color);
          cursor: pointer;
          border-radius: 50%;
          margin-top: calc((var(--thumb-size) - var(--track-height)) / -2);
        }

        .slider-thumb::-moz-range-thumb {
          width: var(--thumb-size);
          height: var(--thumb-size);
          background: var(--thumb-color);
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }

        .slider-thumb::-webkit-slider-runnable-track {
            height: var(--track-height);
            background: var(--track-color);
            border-radius: 10px;
        }
         .slider-thumb::-moz-range-track {
            height: var(--track-height);
            background: var(--track-color);
            border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default SizeSlider;