import { createContext, useContext, useCallback, useRef, useSyncExternalStore, type ReactNode } from "react";

export interface DiagnosticsState {
  thinkingContent: string;
  rawLines: string[];
  systemPrompt: string | null;
  error: string | null;
  isGenerating: boolean;
  rawJson: string | null;
}

const INITIAL_STATE: DiagnosticsState = {
  thinkingContent: "",
  rawLines: [],
  systemPrompt: null,
  error: null,
  isGenerating: false,
  rawJson: null,
};

type DiagnosticsStore = {
  getState: () => DiagnosticsState;
  subscribe: (listener: () => void) => () => void;
  setState: (partial: Partial<DiagnosticsState>) => void;
  reset: () => void;
};

function createDiagnosticsStore(): DiagnosticsStore {
  let state = { ...INITIAL_STATE };
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState: (partial) => {
      state = { ...state, ...partial };
      listeners.forEach((l) => l());
    },
    reset: () => {
      state = { ...INITIAL_STATE };
      listeners.forEach((l) => l());
    },
  };
}

const DiagnosticsContext = createContext<DiagnosticsStore | null>(null);

export function DiagnosticsProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<DiagnosticsStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createDiagnosticsStore();
  }

  return (
    <DiagnosticsContext.Provider value={storeRef.current}>
      {children}
    </DiagnosticsContext.Provider>
  );
}

/**
 * Hook for the adapter to write diagnostics state.
 */
export function useDiagnosticsDispatch() {
  const store = useContext(DiagnosticsContext);
  if (!store) throw new Error("useDiagnosticsDispatch must be used within DiagnosticsProvider");

  const setState = useCallback(
    (partial: Partial<DiagnosticsState>) => store.setState(partial),
    [store],
  );

  const reset = useCallback(() => store.reset(), [store]);

  return { setState, reset };
}

/**
 * Hook for components to read diagnostics state reactively.
 */
export function useDiagnostics(): DiagnosticsState {
  const store = useContext(DiagnosticsContext);
  if (!store) throw new Error("useDiagnostics must be used within DiagnosticsProvider");

  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
