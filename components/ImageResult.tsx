/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ResetIcon, SaveAsPngIcon } from "./Icons";
import { GeneratedImage } from "../types";
import { generateSingleLetterImage } from "../services/geminiService";
import SizeSlider from "./SizeSlider";

interface ImageResultProps {
  stylePrompt: string;
  textPrompt: string;
  imagesData: GeneratedImage[];
  onReset: () => void;
  onImageUpdate: (newImage: GeneratedImage) => void;
  onOpenModal: (image: GeneratedImage) => void;
}

const ImageCard: React.FC<{
  src: string;
  letter: string;
  onClick: () => void;
  size: number;
}> = ({ src, letter, onClick, size }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`View letter ${letter.toUpperCase()}`}
      className="group relative bg-[var(--background-secondary)] rounded-xl shadow-md overflow-hidden transition transform duration-200 cursor-pointer flex-shrink-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={src}
        alt={`Letter ${letter.toUpperCase()}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <span className="text-white text-lg font-bold">View</span>
      </div>
    </div>
  );
};

const ImageResult: React.FC<ImageResultProps> = ({
  stylePrompt,
  textPrompt,
  imagesData,
  onReset,
  onImageUpdate,
  onOpenModal,
}) => {
  const [imageSize, setImageSize] = useState(256);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const innerWrapperRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [maxVisibleCardSize, setMaxVisibleCardSize] = useState<number | null>(
    null
  );

  // Recalculate the maximum visible card size on mount and when the window resizes
  useEffect(() => {
    const recalcMaxSize = () => {
      if (!viewportContainerRef.current) return;
      const container = viewportContainerRef.current;
      const containerStyles = getComputedStyle(container);
      const containerPaddingY =
        parseFloat(containerStyles.paddingTop) +
        parseFloat(containerStyles.paddingBottom);
      let availableHeight = container.clientHeight - containerPaddingY;

      if (innerWrapperRef.current) {
        const innerStyles = getComputedStyle(innerWrapperRef.current);
        const innerPaddingY =
          parseFloat(innerStyles.paddingTop) +
          parseFloat(innerStyles.paddingBottom);
        availableHeight -= innerPaddingY;
      }

      if (rowRef.current) {
        const rowStyles = getComputedStyle(rowRef.current);
        const rowPaddingY =
          parseFloat(rowStyles.paddingTop) +
          parseFloat(rowStyles.paddingBottom);
        availableHeight -= rowPaddingY;
      }

      const buffered = Math.max(0, Math.floor(availableHeight));
      setMaxVisibleCardSize(buffered);
    };

    recalcMaxSize();
    window.addEventListener("resize", recalcMaxSize);
    return () => window.removeEventListener("resize", recalcMaxSize);
  }, [imagesData.length]);

  // Clamp the display size to ensure the cards are always fully visible vertically
  const displayImageSize = useMemo(() => {
    if (maxVisibleCardSize == null || maxVisibleCardSize <= 0) return imageSize;
    return Math.max(80, Math.min(imageSize, maxVisibleCardSize));
  }, [imageSize, maxVisibleCardSize]);

  const handleSaveAsPng = async () => {
    if (imagesData.length === 0) return;

    const imageMap = new Map<string, string>();
    imagesData.forEach((item) => {
      imageMap.set(item.letter.toLowerCase(), item.image);
      imageMap.set(item.letter.toUpperCase(), item.image);
    });

    const charsToRender = textPrompt
      .split("")
      .filter((char) => /[a-zA-Z]/.test(char));
    if (charsToRender.length === 0) return;

    const imageSources = charsToRender
      .map((char) => imageMap.get(char))
      .filter((img): img is string => !!img);

    if (imageSources.length !== charsToRender.length) {
      console.error("Mismatch between renderable characters and found images.");
      alert("Sorry, an error occurred while preparing the image download.");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert(
        "Canvas context is not available. This feature is not supported in your browser."
      );
      return;
    }

    const imagePromises = imageSources.map((src) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error(`Failed to load image for stitching.`));
        img.src = src;
      });
    });

    try {
      const loadedImages = await Promise.all(imagePromises);

      if (loadedImages.length === 0 || !loadedImages[0]) {
        throw new Error("No images were loaded successfully for stitching.");
      }

      const imageWidth = loadedImages[0].width;
      const imageHeight = loadedImages[0].height;

      canvas.width = imageWidth * loadedImages.length;
      canvas.height = imageHeight;

      loadedImages.forEach((img, index) => {
        ctx.drawImage(img, index * imageWidth, 0);
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      const sanitizedTextPrompt = textPrompt.replace(/[^a-zA-Z0-9]/g, "");
      link.download = `gentype_${sanitizedTextPrompt}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to create combined image for download:", error);
      alert(
        `Sorry, there was an error creating the combined image for download. ${
          error instanceof Error ? error.message : ""
        }`
      );
    }
  };

  const imageMap = new Map<string, GeneratedImage>();
  imagesData.forEach((item) => {
    imageMap.set(item.letter, item);
  });

  const lettersToDisplay = textPrompt
    .split("")
    .filter((char) => /[a-zA-Z]/.test(char));
  const hasLetters = lettersToDisplay.length > 0;

  return (
    <div className="w-full flex flex-col min-h-[20vh] sm:h-auto bg-[var(--background-secondary)] bg-opacity-70 rounded-2xl sm:rounded-3xl border border-[var(--border-primary)]">
      <div
        ref={viewportContainerRef}
        className="flex-grow w-full flex items-start justify-start p-4 overflow-hidden"
      >
        {imagesData.length > 0 ? (
          <div ref={innerWrapperRef} className="w-full">
            <div
              ref={rowRef}
              className="flex flex-nowrap items-start gap-2 overflow-x-auto overflow-y-hidden scrollbar h-auto p-2 w-full"
            >
              {lettersToDisplay.map((letter, index) => {
                const imageData = imageMap.get(letter);
                if (!imageData) return null;
                return (
                  <ImageCard
                    key={`${letter}-${index}`}
                    src={imageData.image}
                    letter={letter}
                    onClick={() => onOpenModal(imageData)}
                    size={displayImageSize}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center my-auto">
            <p className="text-xl sm:text-2xl font-bold text-[var(--text-tertiary)]">
              No Word Yet
            </p>
          </div>
        )}
      </div>

      {/* Controls section */}
      <div className="w-full rounded-b-full border-t border-[var(--border-secondary)] bg-[var(--background-secondary)]/50">
        <div className="p-4 flex flex-row items-center justify-between gap-4">
          {/* Size Slider */}
          <div className="flex-1 min-w-0">
            <SizeSlider
              size={imageSize}
              onSizeChange={setImageSize}
              disabled={imagesData.length === 0 || !hasLetters}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-0 flex-shrink-0">
            <button
              onClick={handleSaveAsPng}
              disabled={imagesData.length === 0 || !hasLetters}
              className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 border border-[var(--border-secondary)] font-semibold text-sm sm:text-base rounded-l-full hover:bg-[var(--background-tertiary)] active:bg-[var(--background-interactive)] transition-all duration-200 disabled:bg-[var(--background-tertiary)] disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-60 text-[var(--text-secondary)] bg-[var(--background-secondary)] shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]"
              title={
                imagesData.length === 0 || !hasLetters
                  ? "Add letters to enable download"
                  : "Download as PNG"
              }
            >
              <SaveAsPngIcon />
              <span className="hidden sm:inline whitespace-nowrap">
                Save as PNG
              </span>
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 border border-l-0 border-[var(--border-secondary)] font-semibold text-sm sm:text-base rounded-r-full hover:bg-[var(--background-tertiary)] active:bg-[var(--background-interactive)] transition-all duration-200 text-[var(--text-secondary)] bg-[var(--background-secondary)] shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]"
              title="Reset and start over"
            >
              <ResetIcon />
              <span className="hidden sm:inline whitespace-nowrap">
                Start Over
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageResult;