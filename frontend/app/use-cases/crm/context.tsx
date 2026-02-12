'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageState {
  pageType: string;
  pageTitle: string;
  formData?: Record<string, unknown>;
  hints?: Record<string, unknown>;
}

export interface CrmAiContextValue {
  pageState: PageState;
  setPageState: (state: PageState) => void;
  updateFormData: (updates: Record<string, unknown>) => void;

  /** Ref holding a callback to push form updates into the active page */
  formUpdateRef: React.MutableRefObject<
    ((updates: Record<string, unknown>) => void) | null
  >;
  registerFormCallback: (
    cb: ((updates: Record<string, unknown>) => void) | null
  ) => void;

  /** Navigate to a CRM page from the AI assistant */
  navigate: (path: string) => void;

  /** Ref holding a callback the current page registers for data refresh */
  refreshRef: React.MutableRefObject<(() => void) | null>;
  registerRefreshCallback: (cb: (() => void) | null) => void;
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
  const router = useRouter();

  const [pageState, setPageStateRaw] = useState<PageState>({
    pageType: '',
    pageTitle: '',
  });

  const formUpdateRef = useRef<
    ((updates: Record<string, unknown>) => void) | null
  >(null);

  const refreshRef = useRef<(() => void) | null>(null);

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

  const registerRefreshCallback = useCallback(
    (cb: (() => void) | null) => {
      refreshRef.current = cb;
    },
    []
  );

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  return (
    <CrmAiContext.Provider
      value={{
        pageState,
        setPageState,
        updateFormData,
        formUpdateRef,
        registerFormCallback,
        navigate,
        refreshRef,
        registerRefreshCallback,
      }}
    >
      {children}
    </CrmAiContext.Provider>
  );
}
