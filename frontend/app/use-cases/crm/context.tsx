'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageState {
  /** Identifier for the current page (e.g. "clients-new", "projects-list") */
  pageType: string;
  /** Human-readable page title */
  pageTitle: string;
  /** Current form data (for form pages like new-client, new-project) */
  formData?: Record<string, unknown>;
  /** Extra context hints for the AI (e.g. selected filters, active item) */
  hints?: Record<string, unknown>;
}

export interface CrmAiContextValue {
  /** Current page state – set by each page component */
  pageState: PageState;
  setPageState: (state: PageState) => void;

  /** Update individual form fields (merges into existing formData) */
  updateFormData: (updates: Record<string, unknown>) => void;

  /**
   * Ref holding a callback that the AI assistant can invoke to push form
   * updates back into the active page's form. Each form page registers
   * its own callback on mount.
   */
  formUpdateRef: React.MutableRefObject<
    ((updates: Record<string, unknown>) => void) | null
  >;

  /** Register a form-update callback (convenience wrapper) */
  registerFormCallback: (
    cb: ((updates: Record<string, unknown>) => void) | null
  ) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CrmAiContext = createContext<CrmAiContextValue | null>(null);

export function useCrmAi() {
  const ctx = useContext(CrmAiContext);
  if (!ctx) throw new Error('useCrmAi must be used inside <CrmAiProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CrmAiProvider({ children }: { children: React.ReactNode }) {
  const [pageState, setPageStateRaw] = useState<PageState>({
    pageType: '',
    pageTitle: '',
  });

  const formUpdateRef = useRef<
    ((updates: Record<string, unknown>) => void) | null
  >(null);

  const setPageState = useCallback((state: PageState) => {
    setPageStateRaw(state);
  }, []);

  const updateFormData = useCallback(
    (updates: Record<string, unknown>) => {
      setPageStateRaw((prev) => ({
        ...prev,
        formData: { ...prev.formData, ...updates },
      }));
    },
    []
  );

  const registerFormCallback = useCallback(
    (cb: ((updates: Record<string, unknown>) => void) | null) => {
      formUpdateRef.current = cb;
    },
    []
  );

  return (
    <CrmAiContext.Provider
      value={{
        pageState,
        setPageState,
        updateFormData,
        formUpdateRef,
        registerFormCallback,
      }}
    >
      {children}
    </CrmAiContext.Provider>
  );
}
