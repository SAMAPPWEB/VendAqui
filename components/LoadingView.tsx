/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface LoadingViewProps {
  stylePrompt: string;
  textPrompt: string;
}

const LoadingView: React.FC<LoadingViewProps> = ({ stylePrompt, textPrompt }) => {
  const lettersToDisplay = textPrompt.split('').filter(char => /[a-zA-Z]/.test(char));

  return (
    <div className="text-center flex flex-col items-center mt-6 sm:mt-8">
      <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-t-[var(--text-primary)] border-r-[var(--text-primary)] border-b-[var(--text-primary)] border-l-[var(--border-secondary)] rounded-full animate-spin mb-6 sm:mb-8"></div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-[var(--text-primary)] px-4">Generating your word...</h2>
      <p className="text-[var(--text-secondary)] text-base sm:text-lg mb-6 sm:mb-8 px-4">This may take a moment. The style is being applied to each unique letter.</p>
      
      <div className="flex justify-center gap-2 sm:gap-3 mt-4 px-4 overflow-x-auto max-w-full">
        {lettersToDisplay.map((char, index) => (
          <div
            key={`${char}-${index}`}
            className="w-12 h-16 sm:w-14 sm:h-20 bg-[var(--background-interactive)]/80 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold text-[var(--text-tertiary)] animate-pulse flex-shrink-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {char.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingView;