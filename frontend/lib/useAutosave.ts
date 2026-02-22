import { useCallback, useRef, useEffect, useState } from 'react';

interface AutosaveOptions {
  onSave: (data: unknown) => Promise<void>;
  debounceMs?: number;
  onSuccess?: (message?: string) => void;
  onError?: (error: Error) => void;
}

interface AutosaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsaved: boolean;
}

/**
 * useAutosave Hook
 *
 * Provides automatic saving with debounce, plus manual save trigger
 *
 * @example
 * const { autosave, manualSave, status } = useAutosave({
 *   onSave: async (data) => await fetch('/api/save', { method: 'POST', body: JSON.stringify(data) }),
 *   debounceMs: 1000,
 * });
 *
 * // Auto-save on field changes
 * <input onChange={(e) => autosave({ field: e.target.value })} />
 *
 * // Manual save button
 * <button onClick={manualSave} disabled={status.isSaving}>
 *   {status.isSaving ? 'Saving...' : 'Save'}
 * </button>
 */
export function useAutosave(options: AutosaveOptions) {
  const {
    onSave,
    debounceMs = 2000,
    onSuccess,
    onError,
  } = options;

  const [status, setStatus] = useState<AutosaveStatus>({
    isSaving: false,
    lastSaved: null,
    hasUnsaved: false,
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<unknown>(null);
  const isSavingRef = useRef(false);

  // Perform the actual save
  const performSave = useCallback(async (data: unknown) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus(prev => ({ ...prev, isSaving: true }));

    try {
      await onSave(data);
      setStatus({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsaved: false,
      });
      onSuccess?.('Saved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setStatus(prev => ({ ...prev, isSaving: false }));
      onError?.(err);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onSuccess, onError]);

  // Debounced autosave
  const autosave = useCallback((data: unknown) => {
    pendingDataRef.current = data;
    setStatus(prev => ({ ...prev, hasUnsaved: true }));

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        performSave(pendingDataRef.current);
      }
    }, debounceMs);
  }, [debounceMs, performSave]);

  // Manual save (bypasses debounce)
  const manualSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingDataRef.current) {
      performSave(pendingDataRef.current);
    }
  }, [performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    autosave,
    manualSave,
    status,
  };
}
