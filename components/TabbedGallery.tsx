/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from "react";
import { HistoryItem } from "../types";
import SampleGallery from "./SampleGallery";
import HistoryGallery from "./HistoryGallery";

interface TabbedGalleryProps {
  history: HistoryItem[];
  onHistorySelect: (item: HistoryItem) => void;
  onPromptSelect: (prompt: string) => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  disabled?: boolean;
}

type TabType = "gallery" | "history";

const TabbedGallery: React.FC<TabbedGalleryProps> = ({
  history,
  onHistorySelect,
  onPromptSelect,
  activeTab: controlledActiveTab,
  onTabChange,
  disabled = false,
}) => {
  const [internalActiveTab, setInternalActiveTab] =
    useState<TabType>("gallery");

  // Use controlled tab if provided, otherwise use internal state
  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  const tabs = [
    { id: "gallery" as const, label: "Gallery" },
    { id: "history" as const, label: "History" },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-[var(--border-secondary)] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-center font-semibold transition-all duration-200 border-b-2 ${
              activeTab === tab.id
                ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "gallery" && (
          <SampleGallery
            onPromptSelect={onPromptSelect}
            hideHeader={true}
            disabled={disabled}
          />
        )}
        {activeTab === "history" && (
          <HistoryGallery
            history={history}
            onHistorySelect={onHistorySelect}
            hideHeader={true}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

export default TabbedGallery;