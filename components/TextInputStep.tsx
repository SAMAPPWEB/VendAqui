/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from "react";
import { ArrowLeftIcon, SparklesIcon, InfoIcon } from "./Icons";
import { DEFAULT_LETTER_PROMPT_TEMPLATE } from "../services/geminiService";
import { IMAGE_MODEL_OPTIONS, ImageModel } from "../types";

interface TextInputStepProps {
  stylePrompt: string;
  text: string;
  onTextChange: (text: string) => void;
  onSubmit: (text: string, promptTemplate?: string) => void;
  error: string | null;
  onErrorDismiss: () => void;
  imageModel: ImageModel;
  onImageModelChange: (model: ImageModel) => void;
  isRewriterEnabled: boolean;
  onIsRewriterEnabledChange: (enabled: boolean) => void;
  isDisabled?: boolean;
  hasApiKey: boolean;
  onShowApiKeyModal: () => void;
}

const TextInputStep: React.FC<TextInputStepProps> = ({
  stylePrompt,
  text,
  onTextChange,
  onSubmit,
  error,
  onErrorDismiss,
  imageModel,
  onImageModelChange,
  isRewriterEnabled,
  onIsRewriterEnabledChange,
  isDisabled = false,
  hasApiKey,
  onShowApiKeyModal,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState(
    DEFAULT_LETTER_PROMPT_TEMPLATE
  );
  const formRef = useRef<HTMLFormElement>(null);

  // TESTING: Set this to true to force show a long error message for styling verification
  const SHOW_TEST_ERROR = false;
  
  const activeError = SHOW_TEST_ERROR 
    ? "This is a test error message that is intentionally long to verify that the UI correctly wraps text and displays the full message without truncation. This ensures users can read detailed API error descriptions if they occur." 
    : error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim(), showAdvanced ? promptTemplate : undefined);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value.toUpperCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && stylePrompt.trim()) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const handleSelectKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Programmatically trigger the select dropdown
      const select = e.currentTarget;
      select.click();
    }
  };

  // Robust check for quota or API key related errors
  const isQuotaError =
    activeError &&
    (activeError.includes("429") ||
      activeError.toLowerCase().includes("quota") ||
      activeError.toLowerCase().includes("limit") ||
      activeError.toLowerCase().includes("billing") ||
      activeError.toLowerCase().includes("key"));

  return (
    <section className="w-full flex flex-col gap-4 relative z-20">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wider uppercase border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-full px-2 py-0.5">
          Step 2
        </span>
        <span>Enter your word</span>
      </h2>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full"
      >
        <div className="w-full border border-[var(--border-primary)] rounded-3xl shadow-sm p-4 group transition-all duration-300 flex flex-col">
          <div className="flex-grow overflow-hidden min-w-0">
            <textarea
              id="text-input"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="WORD"
              disabled={isDisabled}
              className={`bg-transparent w-full min-w-0 whitespace-nowrap text-6xl lg:text-8xl font-bold tracking-[.2em] text-left focus:outline-none overflow-x-auto overflow-y-hidden scrollbar resize-none border-0 h-auto min-h-fit ${
                isDisabled
                  ? "text-[var(--text-tertiary)] placeholder-[var(--text-tertiary)] cursor-not-allowed"
                  : "text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
              }`}
              rows={1}
              autoFocus={!isDisabled}
            />
          </div>
          <div className="w-full pt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="sm:col-span-2">
                <label
                  htmlFor="model-select"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
                >
                  Image Model
                </label>
                <select
                  id="model-select"
                  value={imageModel}
                  onChange={(e) =>
                    onImageModelChange(e.target.value as ImageModel)
                  }
                  onKeyDown={handleSelectKeyDown}
                  disabled={isDisabled}
                  className={`w-full bg-[var(--background-secondary)] border border-[var(--border-primary)] text-sm rounded-xl block p-3 shadow-sm transition-colors duration-200 ${
                    isDisabled
                      ? "text-[var(--text-tertiary)] cursor-not-allowed opacity-50"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {IMAGE_MODEL_OPTIONS.map((model) => {
                    const needsKey =
                      model.id !== "gemini-2.5-flash-image";
                    const showLock = needsKey && !hasApiKey;
                    return (
                      <option key={model.id} value={model.id}>
                        {model.name} {showLock ? "🔒" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="sm:col-span-1 flex items-center justify-between sm:block">
                <div className="flex items-center gap-2 sm:mb-1.5">
                  <label
                    id="rewriter-label"
                    className="text-sm font-medium text-[var(--text-secondary)]"
                  >
                    Prompt Rewriter
                  </label>
                  <div className="relative">
                    <div
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-help transition-colors duration-200 peer"
                      tabIndex={0}
                      aria-label="More info about Prompt Rewriter"
                    >
                      <InfoIcon size={14} />
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-[var(--interactive-primary-bg)] text-[var(--interactive-primary-text)] text-xs rounded-lg opacity-0 peer-hover:opacity-100 peer-focus:opacity-100 pointer-events-none transition-opacity duration-200 z-[999] w-48 sm:w-56 text-center whitespace-normal shadow-xl">
                      Enhances your style prompt with AI to generate more detailed and effective descriptions for better image results.
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-[var(--interactive-primary-bg)]"></div>
                    </div>
                  </div>
                </div>
                <div className="sm:h-[46px] flex items-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isRewriterEnabled}
                    onClick={() =>
                      onIsRewriterEnabledChange(!isRewriterEnabled)
                    }
                    disabled={isDisabled}
                    className={`${
                      isRewriterEnabled
                        ? "bg-[var(--interactive-primary-bg)]"
                        : "bg-[var(--background-interactive)]"
                    } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)] ${
                      isDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                    aria-labelledby="rewriter-label"
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        isRewriterEnabled ? "translate-x-5" : "translate-x-0"
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--background-secondary)] shadow ring-0 transition-transform duration-200`}
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full">
              <button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                disabled={!text.trim() || !stylePrompt.trim() || isDisabled}
                className="flex w-full items-center justify-center gap-3 px-8 py-4 border font-bold text-lg rounded-full disabled:bg-[var(--interactive-disabled-bg)] disabled:cursor-not-allowed disabled:opacity-70 disabled:text-[var(--interactive-disabled-text)] bg-[var(--interactive-primary-bg)] text-[var(--interactive-primary-text)] hover:bg-[var(--interactive-primary-hover-bg)] transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]"
              >
                <span>Generate</span>
                <SparklesIcon />
              </button>
            </div>
          </div>
        </div>

        {activeError && (
          <div
            role="alert"
            className="flex items-start gap-3 w-full border border-[var(--text-error)] bg-[var(--error-bg)]/10 rounded-3xl px-4 py-3 text-sm text-[var(--text-error)] shadow-sm"
          >
            <div className="flex items-start my-auto gap-2 flex-1 min-w-0">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
              <span className="font-medium break-words whitespace-pre-wrap text-left">
                {isQuotaError
                  ? "Quota limit reached. Add an API key to continue."
                  : activeError}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2 mt-0.5">
              {isQuotaError && (
                <button
                  type="button"
                  onClick={onShowApiKeyModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-[var(--text-error)] text-[var(--text-error)] rounded-full text-xs font-bold hover:bg-[var(--text-error)]/10 transition-colors shadow-sm whitespace-nowrap"
                >
                  <SparklesIcon size={16} />
                  <span>Add Key</span>
                </button>
              )}
              <button
                type="button"
                onClick={onErrorDismiss}
                aria-label="Dismiss error"
                className="p-1 hover:bg-[var(--text-error)]/10 rounded-full transition-colors flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
};

export default TextInputStep;