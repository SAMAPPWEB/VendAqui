/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from "react";
import {
  ArrowRight,
  ArrowLeft,
  Sparkle,
  DownloadSimple,
  ArrowCounterClockwise,
  FilePng,
  X,
  ArrowClockwise,
  Copy,
  Check,
  ArrowUpRight,
  Info,
  Sun,
  Moon,
} from "phosphor-react";

export const ArrowRightIcon: React.FC = () => (
  <ArrowRight size={24} weight="bold" />
);

export const ArrowLeftIcon: React.FC = () => (
  <ArrowLeft size={24} weight="bold" />
);

export const SparklesIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Sparkle size={size} weight="bold" />
);

export const DownloadIcon: React.FC = () => (
  <DownloadSimple size={24} weight="bold" />
);

export const ResetIcon: React.FC = () => (
  <ArrowCounterClockwise size={24} weight="bold" />
);

export const SaveAsPngIcon: React.FC = () => (
  <FilePng size={24} weight="bold" />
);

export const RegenerateIcon: React.FC = () => (
  <ArrowClockwise size={24} weight="bold" />
);

export const InfoIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <Info size={size} weight="regular" />
);

export const CopyIcon: React.FC = () => <Copy size={24} weight="bold" />;

export const CloseIcon: React.FC = () => <X size={28} weight="bold" />;

export const CheckIcon: React.FC = () => <Check size={24} weight="bold" />;

export const ViewHistoryIcon: React.FC = () => (
  <ArrowUpRight size={20} weight="bold" />
);

export const SunIcon: React.FC = () => <Sun size={24} weight="bold" />;

export const MoonIcon: React.FC = () => <Moon size={24} weight="bold" />;
