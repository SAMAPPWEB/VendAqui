/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {useCallback, useState, useEffect} from 'react';

// Interface for the injected window.aistudio object
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

export const useApiKey = () => {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const checkApiKey = useCallback(async () => {
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    if (aistudio) {
      try {
        // Check if key is already selected
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } catch (error) {
        console.warn('API Key check failed', error);
        // If check fails, safe to assume false to avoid blocking?
        // But if check fails, we probably don't have a key usable.
        setHasApiKey(false);
      }
    } else {
      // If no aistudio, assume environment has key configured
      setHasApiKey(true);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
    // Re-check on focus to handle cases where key was detached/attached in another tab or UI
    window.addEventListener('focus', checkApiKey);
    return () => window.removeEventListener('focus', checkApiKey);
  }, [checkApiKey]);

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    
    // If the environment supports key selection
    if (aistudio) {
      try {
        // Check if key is already selected
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
        if (!hasKey) {
          setShowApiKeyDialog(true);
          return false;
        }
        return true;
      } catch (error) {
        // Fallback if check fails
        console.warn('API Key check failed', error);
        setHasApiKey(false);
        setShowApiKeyDialog(true);
        return false;
      }
    }
    setHasApiKey(true);
    return true;
  }, []);

  const handleApiKeyDialogContinue = useCallback(async () => {
    setShowApiKeyDialog(false);
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // Optimistically set true to avoid race condition per instructions
        setHasApiKey(true);
      } catch (error) {
         console.error('Key selection failed or cancelled', error);
         checkApiKey(); // Re-verify status
      }
    }
  }, [checkApiKey]);

  return {
    showApiKeyDialog,
    setShowApiKeyDialog, // Exposed in case you need to trigger it from API errors
    validateApiKey,
    handleApiKeyDialogContinue,
    hasApiKey,
  };
};