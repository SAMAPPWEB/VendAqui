/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface PromptDisplayProps {
  stylePrompt: string;
  textPrompt?: string;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ stylePrompt, textPrompt }) => {
  return (
    <div className="w-full max-w-2xl mb-8 sm:mb-10 bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl shadow-sm p-3 sm:p-4 text-center text-sm sm:text-base transition-all duration-200 mx-2 sm:mx-auto">
      <p className="truncate px-2">
        <span className="font-semibold text-stone-500">Style: </span>
        <span className="font-medium text-stone-800">{`'${stylePrompt}'`}</span>
        {textPrompt && (
          <>
            <span className="mx-2 text-stone-300">|</span>
            <span className="font-semibold text-stone-500">Text: </span>
            <span className="font-medium text-stone-800">{`'${textPrompt}'`}</span>
          </>
        )}
      </p>
    </div>
  );
};

export default PromptDisplay;